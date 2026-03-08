import { useRef, useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

interface UseWebRTCOptions {
  callId: string;
  userId: string;
  isCaller: boolean;
}

export const useWebRTC = ({ callId, userId, isCaller }: UseWebRTCOptions) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<string>("new");
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const originalVideoTrackRef = useRef<MediaStreamTrack | null>(null);

  const startLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error("Failed to get media:", err);
      // Fallback to audio only
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStreamRef.current = stream;
        setLocalStream(stream);
        setIsVideoEnabled(false);
        return stream;
      } catch (audioErr) {
        console.error("Failed to get audio:", audioErr);
        throw audioErr;
      }
    }
  }, []);

  const setupPeerConnection = useCallback(
    (stream: MediaStream) => {
      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;

      // Add local tracks
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // Handle remote tracks
      const remote = new MediaStream();
      setRemoteStream(remote);
      pc.ontrack = (event) => {
        event.streams[0]?.getTracks().forEach((track) => remote.addTrack(track));
        setRemoteStream(new MediaStream(remote.getTracks()));
      };

      pc.onconnectionstatechange = () => {
        setConnectionState(pc.connectionState);
      };

      return pc;
    },
    []
  );

  const connect = useCallback(async () => {
    const stream = await startLocalStream();
    const pc = setupPeerConnection(stream);

    // Signaling channel
    const channel = supabase.channel(`call-signal-${callId}`, {
      config: { broadcast: { self: false } },
    });
    channelRef.current = channel;

    // ICE candidate exchange
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        channel.send({
          type: "broadcast",
          event: "ice-candidate",
          payload: { candidate: event.candidate.toJSON(), from: userId },
        });
      }
    };

    channel.on("broadcast", { event: "ice-candidate" }, async ({ payload }) => {
      if (payload.from !== userId && pc.remoteDescription) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
        } catch (e) {
          console.error("Error adding ICE candidate:", e);
        }
      }
    });

    channel.on("broadcast", { event: "offer" }, async ({ payload }) => {
      if (payload.from !== userId) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          channel.send({
            type: "broadcast",
            event: "answer",
            payload: { sdp: answer, from: userId },
          });
        } catch (e) {
          console.error("Error handling offer:", e);
        }
      }
    });

    channel.on("broadcast", { event: "answer" }, async ({ payload }) => {
      if (payload.from !== userId) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        } catch (e) {
          console.error("Error handling answer:", e);
        }
      }
    });

    await channel.subscribe();

    // Caller creates offer
    if (isCaller) {
      // Small delay for the other party to join
      setTimeout(async () => {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          channel.send({
            type: "broadcast",
            event: "offer",
            payload: { sdp: offer, from: userId },
          });
        } catch (e) {
          console.error("Error creating offer:", e);
        }
      }, 2000);
    }
  }, [callId, userId, isCaller, startLocalStream, setupPeerConnection]);

  const toggleAudio = useCallback(() => {
    localStreamRef.current?.getAudioTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setIsAudioEnabled((prev) => !prev);
  }, []);

  const toggleVideo = useCallback(() => {
    localStreamRef.current?.getVideoTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setIsVideoEnabled((prev) => !prev);
  }, []);

  const toggleScreenShare = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc) return;

    if (isScreenSharing) {
      // Stop screen share, restore camera
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      const camTrack = originalVideoTrackRef.current;
      if (camTrack) {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) await sender.replaceTrack(camTrack);
      }
      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];

        // Save original camera track
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) {
          if (!originalVideoTrackRef.current) {
            originalVideoTrackRef.current = sender.track;
          }
          await sender.replaceTrack(screenTrack);
        }

        // When user stops sharing via browser UI
        screenTrack.onended = () => {
          const camTrack = originalVideoTrackRef.current;
          if (camTrack && sender) {
            sender.replaceTrack(camTrack);
          }
          screenStreamRef.current = null;
          setIsScreenSharing(false);
        };

        setIsScreenSharing(true);
      } catch (err) {
        console.error("Screen share failed:", err);
      }
    }
  }, [isScreenSharing]);

  const disconnect = useCallback(() => {
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }
    setLocalStream(null);
    setRemoteStream(null);
    setConnectionState("closed");
    setIsScreenSharing(false);
  }, []);

  useEffect(() => {
    return () => {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      pcRef.current?.close();
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  return {
    localStream,
    remoteStream,
    connectionState,
    isAudioEnabled,
    isVideoEnabled,
    connect,
    toggleAudio,
    toggleVideo,
    disconnect,
  };
};

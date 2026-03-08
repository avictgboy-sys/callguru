import { useRef, useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const METERED_API_KEY = "47aeef9f8e8613688d21e5b9806098005d0b";

/**
 * Fetch production TURN credentials from Metered.ca REST API.
 * Falls back to free STUN-only if the fetch fails.
 */
async function getIceServers(): Promise<RTCConfiguration> {
  try {
    const res = await fetch(
      `https://callguro.metered.live/api/v1/turn/credentials?apiKey=${METERED_API_KEY}`
    );
    if (!res.ok) throw new Error("Metered API error");
    const iceServers = await res.json();
    return { iceServers, iceCandidatePoolSize: 10 };
  } catch (e) {
    console.warn("Failed to fetch TURN credentials, using fallback STUN:", e);
    return {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
      iceCandidatePoolSize: 10,
    };
  }
}

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
  const remoteStreamRef = useRef<MediaStream>(new MediaStream());
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const hasRemoteDescRef = useRef(false);

  // ── Get local camera + mic ──
  const startLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error("Failed to get video+audio:", err);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true },
        });
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

  // ── Flush queued ICE candidates once remote description is set ──
  const flushCandidates = useCallback(async (pc: RTCPeerConnection) => {
    const queued = pendingCandidatesRef.current.splice(0);
    for (const c of queued) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(c));
      } catch (e) {
        console.warn("Failed to add queued ICE candidate:", e);
      }
    }
  }, []);

  // ── Create peer connection ──
  const setupPeerConnection = useCallback(
    async (stream: MediaStream) => {
      const iceConfig = await getIceServers();
      const pc = new RTCPeerConnection(iceConfig);
      pcRef.current = pc;
      hasRemoteDescRef.current = false;
      pendingCandidatesRef.current = [];

      // Add local tracks
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // Handle remote tracks — accumulate into a single persistent MediaStream
      const remote = remoteStreamRef.current;
      // Clear any stale tracks
      remote.getTracks().forEach((t) => remote.removeTrack(t));

      pc.ontrack = (event) => {
        const incomingTrack = event.track;
        // Avoid duplicates
        const existing = remote.getTracks().find((t) => t.id === incomingTrack.id);
        if (!existing) {
          remote.addTrack(incomingTrack);
        }
        // Trigger React re-render with a new reference
        setRemoteStream(new MediaStream(remote.getTracks()));

        // Handle track ending (remote user toggled off)
        incomingTrack.onended = () => {
          remote.removeTrack(incomingTrack);
          setRemoteStream(new MediaStream(remote.getTracks()));
        };
      };

      pc.onconnectionstatechange = () => {
        console.log("WebRTC connection state:", pc.connectionState);
        setConnectionState(pc.connectionState);
      };

      pc.oniceconnectionstatechange = () => {
        console.log("ICE connection state:", pc.iceConnectionState);
        // Auto-restart ICE if it fails
        if (pc.iceConnectionState === "failed") {
          console.log("ICE failed, restarting...");
          pc.restartIce();
        }
      };

      return pc;
    },
    []
  );

  // ── Main connect function ──
  const connect = useCallback(async () => {
    const stream = await startLocalStream();
    const pc = await setupPeerConnection(stream);

    // Signaling channel via Supabase Realtime broadcast
    const channel = supabase.channel(`call-signal-${callId}`, {
      config: { broadcast: { self: false } },
    });
    channelRef.current = channel;

    // ── ICE candidate exchange ──
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
      if (payload.from === userId) return;
      const candidate = payload.candidate as RTCIceCandidateInit;

      if (hasRemoteDescRef.current) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn("Error adding ICE candidate:", e);
        }
      } else {
        // Queue candidates until remote description is set
        pendingCandidatesRef.current.push(candidate);
      }
    });

    // ── Offer handling (receiver side) ──
    channel.on("broadcast", { event: "offer" }, async ({ payload }) => {
      if (payload.from === userId) return;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        hasRemoteDescRef.current = true;
        await flushCandidates(pc);

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
    });

    // ── Answer handling (caller side) ──
    channel.on("broadcast", { event: "answer" }, async ({ payload }) => {
      if (payload.from === userId) return;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        hasRemoteDescRef.current = true;
        await flushCandidates(pc);
      } catch (e) {
        console.error("Error handling answer:", e);
      }
    });

    // ── "ready" handshake — ensures both sides are subscribed before offer ──
    channel.on("broadcast", { event: "ready" }, async ({ payload }) => {
      if (payload.from === userId) return;
      // The other side is ready; if we're the caller, send the offer now
      if (isCaller && pc.signalingState === "stable" && !hasRemoteDescRef.current) {
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
      }
    });

    // ── Renegotiation: if caller needs to resend offer (e.g. track changes) ──
    pc.onnegotiationneeded = async () => {
      if (!isCaller || pc.signalingState !== "stable") return;
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        channel.send({
          type: "broadcast",
          event: "offer",
          payload: { sdp: offer, from: userId },
        });
      } catch (e) {
        console.error("Error during renegotiation:", e);
      }
    };

    await channel.subscribe();

    // Announce "I'm ready" — both sides do this
    // Small delay to ensure subscription is fully active
    setTimeout(() => {
      channel.send({
        type: "broadcast",
        event: "ready",
        payload: { from: userId },
      });
    }, 500);

    // Caller: also send offer after a longer delay as fallback
    // (in case "ready" messages crossed)
    if (isCaller) {
      setTimeout(async () => {
        if (pc.signalingState === "stable" && !hasRemoteDescRef.current) {
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            channel.send({
              type: "broadcast",
              event: "offer",
              payload: { sdp: offer, from: userId },
            });
          } catch (e) {
            console.error("Error creating fallback offer:", e);
          }
        }
      }, 3000);

      // Retry offer if still not connected after 8s
      setTimeout(async () => {
        if (pc.connectionState !== "connected" && pc.signalingState === "stable") {
          console.log("Retrying offer after timeout...");
          try {
            const offer = await pc.createOffer({ iceRestart: true });
            await pc.setLocalDescription(offer);
            channel.send({
              type: "broadcast",
              event: "offer",
              payload: { sdp: offer, from: userId },
            });
          } catch (e) {
            console.error("Error retrying offer:", e);
          }
        }
      }, 8000);
    }
  }, [callId, userId, isCaller, startLocalStream, setupPeerConnection, flushCandidates]);

  // ── Toggle audio ──
  const toggleAudio = useCallback(() => {
    localStreamRef.current?.getAudioTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setIsAudioEnabled((prev) => !prev);
  }, []);

  // ── Toggle video ──
  const toggleVideo = useCallback(() => {
    localStreamRef.current?.getVideoTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setIsVideoEnabled((prev) => !prev);
  }, []);

  // ── Screen sharing ──
  const toggleScreenShare = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc) return;

    if (isScreenSharing) {
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

        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) {
          if (!originalVideoTrackRef.current) {
            originalVideoTrackRef.current = sender.track;
          }
          await sender.replaceTrack(screenTrack);
        }

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

  // ── Disconnect ──
  const disconnect = useCallback(() => {
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
    pcRef.current = null;
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);
    setConnectionState("closed");
    setIsScreenSharing(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
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
    isScreenSharing,
    connect,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    disconnect,
  };
};

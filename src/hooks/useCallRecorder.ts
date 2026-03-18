import { useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useCallRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);

  const startRecording = useCallback((localStream: MediaStream, remoteStream?: MediaStream | null) => {
    try {
      // Prevent double-start
      if (recorderRef.current && recorderRef.current.state !== "inactive") return;

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const dest = audioContext.createMediaStreamDestination();

      // Mix local audio
      const localAudio = localStream.getAudioTracks();
      if (localAudio.length > 0) {
        const localSource = audioContext.createMediaStreamSource(new MediaStream(localAudio));
        localSource.connect(dest);
      }

      // Mix remote audio
      if (remoteStream) {
        const remoteAudio = remoteStream.getAudioTracks();
        if (remoteAudio.length > 0) {
          const remoteSource = audioContext.createMediaStreamSource(new MediaStream(remoteAudio));
          remoteSource.connect(dest);
        }
      }

      // Combine video (local) + mixed audio
      const combinedStream = new MediaStream();
      localStream.getVideoTracks().forEach((t) => combinedStream.addTrack(t));
      dest.stream.getAudioTracks().forEach((t) => combinedStream.addTrack(t));

      // Optimized bitrate for quality vs size balance
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
        ? "video/webm;codecs=vp8,opus"
        : MediaRecorder.isTypeSupported("video/webm")
          ? "video/webm"
          : "video/mp4";

      const recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 500_000, // 500kbps - good quality, small size
        audioBitsPerSecond: 64_000,  // 64kbps audio
      });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorderRef.current = recorder;
      recorder.start(2000); // 2s chunks for reliability
      setIsRecording(true);
    } catch (err) {
      console.error("Silent recording start failed:", err);
    }
  }, []);

  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const recorder = recorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        setIsRecording(false);
        resolve(null);
        return;
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        chunksRef.current = [];
        setIsRecording(false);
        resolve(blob);
      };

      try {
        recorder.stop();
      } catch (_) {
        setIsRecording(false);
        resolve(null);
      }

      // Close audio context to free resources
      try {
        audioContextRef.current?.close();
        audioContextRef.current = null;
      } catch (_) {}
    });
  }, []);

  const uploadRecording = useCallback(async (blob: Blob, callId: string): Promise<string | null> => {
    try {
      if (!blob || blob.size < 1000) return null; // Skip tiny/empty blobs

      const ext = blob.type.includes("webm") ? "webm" : "mp4";
      const timestamp = Date.now();
      // Unique filename per call to prevent overwrites
      const path = `${callId}/${timestamp}_recording.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("call-recordings")
        .upload(path, blob, {
          contentType: blob.type,
          upsert: false, // Don't overwrite - each recording is unique
        });

      if (uploadError) throw uploadError;

      // Store the path (not public URL) - admin uses signed URLs to access
      await supabase
        .from("calls")
        .update({ recording_url: path } as any)
        .eq("id", callId);

      return path;
    } catch (err) {
      console.error("Recording upload failed:", err);
      return null;
    }
  }, []);

  return {
    isRecording,
    startRecording,
    stopRecording,
    uploadRecording,
  };
};

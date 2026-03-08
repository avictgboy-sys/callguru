import { useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useCallRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback((localStream: MediaStream, remoteStream?: MediaStream | null) => {
    try {
      // Combine local + remote streams
      const audioContext = new AudioContext();
      const dest = audioContext.createMediaStreamDestination();

      // Add local audio
      const localAudio = localStream.getAudioTracks();
      if (localAudio.length > 0) {
        const localSource = audioContext.createMediaStreamSource(
          new MediaStream(localAudio)
        );
        localSource.connect(dest);
      }

      // Add remote audio
      if (remoteStream) {
        const remoteAudio = remoteStream.getAudioTracks();
        if (remoteAudio.length > 0) {
          const remoteSource = audioContext.createMediaStreamSource(
            new MediaStream(remoteAudio)
          );
          remoteSource.connect(dest);
        }
      }

      // Combine video (local) + mixed audio
      const combinedStream = new MediaStream();
      localStream.getVideoTracks().forEach((t) => combinedStream.addTrack(t));
      dest.stream.getAudioTracks().forEach((t) => combinedStream.addTrack(t));

      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus"
        : MediaRecorder.isTypeSupported("video/webm")
        ? "video/webm"
        : "video/mp4";

      const recorder = new MediaRecorder(combinedStream, { mimeType });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorderRef.current = recorder;
      recorder.start(1000);
      setIsRecording(true);
    } catch (err) {
      console.error("Failed to start recording:", err);
    }
  }, []);

  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const recorder = recorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        resolve(null);
        return;
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        chunksRef.current = [];
        setIsRecording(false);
        resolve(blob);
      };

      recorder.stop();
    });
  }, []);

  const uploadRecording = useCallback(async (blob: Blob, callId: string): Promise<string | null> => {
    try {
      const ext = blob.type.includes("webm") ? "webm" : "mp4";
      const path = `${callId}/recording.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("call-recordings")
        .upload(path, blob, { contentType: blob.type, upsert: true });

      if (uploadError) throw uploadError;

      // Save recording URL to call record
      const { data: urlData } = supabase.storage
        .from("call-recordings")
        .getPublicUrl(path);

      const url = urlData.publicUrl;
      setRecordingUrl(url);

      // Update call record with recording path (not public URL since bucket is private)
      await supabase
        .from("calls")
        .update({ recording_url: path } as any)
        .eq("id", callId);

      return url;
    } catch (err) {
      console.error("Failed to upload recording:", err);
      return null;
    }
  }, []);

  return {
    isRecording,
    recordingUrl,
    startRecording,
    stopRecording,
    uploadRecording,
  };
};

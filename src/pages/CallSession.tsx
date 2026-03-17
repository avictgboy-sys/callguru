import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCompleteCall } from "@/hooks/useCalls";
import { useFeeSettings } from "@/hooks/useAppSettings";
import { useWebRTC } from "@/hooks/useWebRTC";
import { useCallRecorder } from "@/hooks/useCallRecorder";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Video, VideoOff, PhoneOff, Clock, Star, Mic, MicOff, MonitorUp, SwitchCamera,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const CallSession = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const completeCall = useCompleteCall();
  const fees = useFeeSettings();

  const callId = params.get("id") || "";
  const providerId = params.get("providerId") || "";
  const providerName = params.get("provider") || "Expert";
  const providerAvatar = params.get("avatar") || "";
  const serviceId = params.get("serviceId") || "";
  const serviceName = params.get("service") || "Consultation";
  const pricePerMin = parseFloat(params.get("rate") || "0");
  const isCaller = params.get("role") !== "provider";

  const [elapsed, setElapsed] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState<{
    duration: number; totalCost: number; fee: number; net: number;
  } | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [callConnected, setCallConnected] = useState(false);
  const [mediaReady, setMediaReady] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLVideoElement>(null);

  const webrtc = useWebRTC({
    callId,
    userId: user?.id || "",
    isCaller,
  });

  const recorder = useCallRecorder();

  // Auto-connect when entering call page
  useEffect(() => {
    if (!callId || !user?.id || mediaReady) return;
    let cancelled = false;
    const autoConnect = async () => {
      try {
        await webrtc.connect();
        if (!cancelled) setMediaReady(true);
      } catch (err) {
        console.error("WebRTC connect failed:", err);
        if (!cancelled) {
          toast.error("ক্যামেরা/মাইক্রোফোন অ্যাক্সেস করা যায়নি।");
        }
      }
    };
    autoConnect();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callId, user?.id]);

  // Attach local stream to video element
  useEffect(() => {
    const el = localVideoRef.current;
    if (el && webrtc.localStream) {
      el.srcObject = webrtc.localStream;
      el.play().catch(() => {});
    }
  }, [webrtc.localStream, webrtc.isVideoEnabled]);

  // Attach remote stream to video elements
  useEffect(() => {
    if (webrtc.remoteStream) {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = webrtc.remoteStream;
        remoteVideoRef.current.play().catch(() => {});
      }
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = webrtc.remoteStream;
        remoteAudioRef.current.play().catch(() => {});
      }
    }
  }, [webrtc.remoteStream]);

  // Quality monitoring
  useEffect(() => {
    if (webrtc.connectionState === "connected") {
      setCallConnected(true);
      if (webrtc.localStream && !recorder.isRecording) {
        recorder.startRecording(webrtc.localStream, webrtc.remoteStream);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webrtc.connectionState, webrtc.localStream]);

  useEffect(() => {
    if (!webrtc.localStream || recorder.isRecording) return;
    const timer = setTimeout(() => {
      if (webrtc.localStream && !recorder.isRecording) {
        recorder.startRecording(webrtc.localStream, webrtc.remoteStream);
      }
    }, 5000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webrtc.localStream]);

  // Timer
  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, [isActive]);

  const durationMinutes = Math.max(Math.ceil(elapsed / 60), 1);
  const runningCost = durationMinutes * pricePerMin;
  const feeAmount = runningCost * (fees.callFeePercent / 100);

  const callEndedRef = useRef(false);

  const handleEndCall = useCallback(async () => {
    if (!callId || callEndedRef.current) return;
    callEndedRef.current = true;
    setIsActive(false);

    // Immediately disconnect WebRTC & broadcast hangup
    try { webrtc.broadcastHangup(); } catch (_) {}
    try { webrtc.disconnect(); } catch (_) {}

    // Stop recording if active
    let recordingBlob: Blob | null = null;
    try {
      if (recorder.isRecording) {
        recordingBlob = await recorder.stopRecording();
      }
    } catch (_) {}

    const mins = Math.max(Math.ceil(elapsed / 60), 1);
    const total = mins * pricePerMin;
    const fee = Math.round(total * (fees.callFeePercent / 100) * 100) / 100;

    try {
      await completeCall.mutateAsync({
        call_id: callId,
        duration_minutes: mins,
      });
      await refreshProfile();

      // Upload recording silently
      if (recordingBlob && recordingBlob.size > 0) {
        recorder.uploadRecording(recordingBlob, callId).catch(() => {});
      }

      setSummary({ duration: mins, totalCost: total, fee, net: total - fee });
      setShowSummary(true);
    } catch (e: any) {
      // Even if billing fails, call is ended — navigate away
      console.error("Complete call error:", e);
      toast.error("কল শেষ হয়েছে। বিলিং সমস্যা হলে পরে সমাধান হবে।");
      navigate("/dashboard");
    }
  }, [callId, elapsed, pricePerMin, fees.callFeePercent, completeCall, refreshProfile, recorder, webrtc, navigate]);

  // Listen for remote hangup
  useEffect(() => {
    webrtc.setOnRemoteHangup(() => {
      if (!callEndedRef.current) {
        toast.info("অপর পক্ষ কল শেষ করেছে");
        handleEndCall();
      }
    });
  }, [webrtc, handleEndCall]);

  // Auto-end call only when WebRTC connection truly fails
  useEffect(() => {
    if (
      mediaReady &&
      isActive &&
      webrtc.connectionState === "failed" &&
      elapsed > 10
    ) {
      const timer = setTimeout(() => {
        if (!callEndedRef.current) {
          toast.info("সংযোগ পুনরুদ্ধার করা যায়নি। কল শেষ হচ্ছে…");
          handleEndCall();
        }
      }, 15000);
      return () => clearTimeout(timer);
    }
  }, [webrtc.connectionState, mediaReady, isActive, elapsed, handleEndCall]);

  // Auto-end on page close/navigate away
  useEffect(() => {
    if (!callId || !isActive) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!callEndedRef.current && isActive) {
        const payload = JSON.stringify({
          p_call_id: callId,
          p_duration_minutes: Math.max(Math.ceil(elapsed / 60), 1),
        });
        navigator.sendBeacon?.(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/complete_call`,
          new Blob([payload], { type: "application/json" })
        );
        e.preventDefault();
        e.returnValue = "কল চলছে। আপনি কি নিশ্চিত যে পেজ ছেড়ে যেতে চান?";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [callId, isActive, elapsed]);

  if (!callId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-sm">
          <CardContent className="pt-6 text-center space-y-4">
            <p className="text-muted-foreground">Invalid call session</p>
            <Button variant="hero" onClick={() => navigate("/marketplace")}>
              Go to Marketplace
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const initials = providerName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const hasRemoteVideo = webrtc.remoteStream && webrtc.remoteStream.getVideoTracks().length > 0 
    && webrtc.remoteStream.getVideoTracks().some(t => t.enabled);

  return (
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden select-none">
      {/* ── Full-screen remote video ── */}
      {!mediaReady ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Avatar className="w-32 h-32 ring-4 ring-white/20 shadow-2xl">
              <AvatarImage src={providerAvatar || undefined} />
              <AvatarFallback className="text-4xl bg-white/10 text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
          </motion.div>
          <div className="text-center">
            <h2 className="text-white text-2xl font-bold">{providerName}</h2>
            <p className="text-white/60 text-sm mt-1">{serviceName}</p>
            <motion.p
              className="text-white/40 text-xs mt-3"
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              কানেক্ট হচ্ছে…
            </motion.p>
          </div>
        </div>
      ) : (
        <>
          {/* Remote video – full screen */}
          <div className="absolute inset-0">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
              style={{ display: hasRemoteVideo ? "block" : "none" }}
            />

            {/* Fallback: no remote video */}
            {!hasRemoteVideo && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 via-black to-gray-900">
                <Avatar className="w-28 h-28 ring-4 ring-white/10 mb-4">
                  <AvatarImage src={providerAvatar || undefined} />
                  <AvatarFallback className="text-3xl bg-white/10 text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-white text-xl font-bold">{providerName}</h2>
                <p className="text-white/50 text-sm mt-1">{serviceName}</p>
                <p className="text-white/40 text-xs mt-3">
                  {webrtc.connectionState === "connected"
                    ? "কানেক্টেড ✓ — অডিও কল চলছে"
                    : webrtc.connectionState === "connecting"
                      ? "কানেক্ট হচ্ছে…"
                      : webrtc.connectionState === "failed"
                        ? "কানেকশন ব্যর্থ…"
                        : "অপেক্ষা করা হচ্ছে…"}
                </p>
              </div>
            )}

            {/* Hidden audio element */}
            <video
              ref={remoteAudioRef}
              autoPlay
              playsInline
              style={{ position: "absolute", width: 0, height: 0, opacity: 0 }}
            />
          </div>

          {/* ── Top bar overlay (IMO style) ── */}
          <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/70 via-black/30 to-transparent pt-safe">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 ring-2 ring-white/20">
                  <AvatarImage src={providerAvatar || undefined} />
                  <AvatarFallback className="text-sm bg-white/10 text-white">{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-white text-sm font-semibold leading-tight">{providerName}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <motion.div
                      className="w-1.5 h-1.5 rounded-full bg-green-400"
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    />
                    <span className="text-white/60 text-xs">
                      {webrtc.connectionState === "connected" ? "কানেক্টেড" : "কানেক্ট হচ্ছে…"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-white/10 backdrop-blur-md rounded-full px-3 py-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-white/70" />
                  <span className="text-white font-mono text-sm font-semibold tabular-nums">
                    {formatTime(elapsed)}
                  </span>
                </div>
                <div className="bg-green-500/20 backdrop-blur-md rounded-full px-3 py-1.5">
                  <span className="text-green-400 text-sm font-semibold">৳{runningCost.toFixed(0)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Local video PiP (IMO style – bottom-right, draggable look) ── */}
          {webrtc.localStream && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="absolute top-20 right-3 w-[110px] h-[150px] sm:w-[130px] sm:h-[180px] rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl z-20"
            >
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{
                  transform: webrtc.facingMode === "user" ? "scaleX(-1)" : "none",
                  display: webrtc.isVideoEnabled ? "block" : "none",
                }}
              />
              {!webrtc.isVideoEnabled && (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                  <VideoOff className="w-6 h-6 text-white/40" />
                </div>
              )}
            </motion.div>
          )}

          {/* ── Connection status pill ── */}
          {mediaReady && webrtc.connectionState !== "connected" && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black/60 backdrop-blur-md rounded-full px-5 py-2.5 flex items-center gap-2"
              >
                <motion.div
                  className="w-2 h-2 rounded-full bg-green-400"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                />
                <span className="text-white/80 text-sm">
                  {webrtc.connectionState === "connecting" ? "কানেক্ট হচ্ছে…" :
                    webrtc.connectionState === "failed" ? "পুনরায় চেষ্টা…" :
                      "অপেক্ষা করা হচ্ছে…"}
                </span>
              </motion.div>
            </div>
          )}
        </>
      )}

      {/* ── Bottom controls (IMO style – floating, rounded, translucent) ── */}
      {isActive && mediaReady && (
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent pb-safe">
          <div className="px-4 pb-6 pt-10">
            <div className="flex items-center justify-center gap-4">
              {/* Mic */}
              <button
                onClick={webrtc.toggleAudio}
                className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md transition-all ${
                  webrtc.isAudioEnabled
                    ? "bg-white/15 text-white hover:bg-white/25"
                    : "bg-red-500/80 text-white"
                }`}
              >
                {webrtc.isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>

              {/* Camera */}
              <button
                onClick={webrtc.toggleVideo}
                className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md transition-all ${
                  webrtc.isVideoEnabled
                    ? "bg-white/15 text-white hover:bg-white/25"
                    : "bg-red-500/80 text-white"
                }`}
              >
                {webrtc.isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>

              {/* Flip Camera */}
              <button
                onClick={webrtc.switchCamera}
                className="w-12 h-12 rounded-full flex items-center justify-center bg-white/15 text-white hover:bg-white/25 backdrop-blur-md transition-all"
              >
                <SwitchCamera className="w-5 h-5" />
              </button>

              {/* Screen Share */}
              <button
                onClick={webrtc.toggleScreenShare}
                className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md transition-all ${
                  webrtc.isScreenSharing
                    ? "bg-blue-500/80 text-white"
                    : "bg-white/15 text-white hover:bg-white/25"
                }`}
              >
                <MonitorUp className="w-5 h-5" />
              </button>

              {/* End Call */}
              <button
                onClick={handleEndCall}
                disabled={completeCall.isPending}
                className="w-14 h-14 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-500/40 hover:bg-red-600 transition-all active:scale-95"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={showSummary} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-sm" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Call Completed ✅</DialogTitle>
          </DialogHeader>
          {summary && (
            <div className="space-y-4 py-2">
              <div className="text-center">
                <p className="text-muted-foreground text-sm">Session with {providerName}</p>
              </div>
              <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium text-foreground">{summary.duration} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rate</span>
                  <span className="font-medium text-foreground">৳{pricePerMin}/min</span>
                </div>
                <div className="flex justify-between border-t border-border pt-2">
                  <span className="text-muted-foreground">Total Charged</span>
                  <span className="font-bold text-foreground">৳{summary.totalCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Platform Fee ({fees.callFeePercent}%)</span>
                  <span className="text-muted-foreground">৳{summary.fee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Provider Receives</span>
                  <span className="text-muted-foreground">৳{summary.net.toFixed(2)}</span>
                </div>
              </div>

              {/* Rating */}
              {isCaller && !reviewSubmitted ? (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-foreground text-center">Rate your experience</p>
                  <div className="flex justify-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className="p-1 transition-transform hover:scale-110"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(star)}
                      >
                        <Star
                          className={`w-8 h-8 transition-colors ${
                            star <= (hoverRating || rating)
                              ? "fill-primary text-primary"
                              : "text-muted-foreground/30"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  {rating > 0 && (
                    <Textarea
                      placeholder="Leave a comment (optional)..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      className="resize-none"
                      rows={2}
                    />
                  )}
                </div>
              ) : reviewSubmitted ? (
                <div className="text-center py-2">
                  <p className="text-sm text-primary font-medium">Thanks for your review! ⭐</p>
                </div>
              ) : null}
            </div>
          )}
          <DialogFooter className="gap-2">
            {isCaller && !reviewSubmitted && rating > 0 && (
              <Button
                variant="default"
                disabled={submittingReview}
                onClick={async () => {
                  if (!callId || !user) return;
                  setSubmittingReview(true);
                  try {
                    const { error } = await supabase.from("reviews").insert({
                      call_id: callId,
                      reviewer_id: user.id,
                      provider_id: providerId,
                      service_id: serviceId,
                      rating,
                      comment: reviewComment.trim() || null,
                    });
                    if (error) throw error;
                    setReviewSubmitted(true);
                    toast.success("Review submitted!");
                  } catch (e: any) {
                    toast.error(e.message || "Failed to submit review");
                  } finally {
                    setSubmittingReview(false);
                  }
                }}
              >
                {submittingReview ? "Submitting…" : "Submit Review"}
              </Button>
            )}
            <Button variant="hero" onClick={() => navigate("/dashboard")}>
              Back to Dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CallSession;

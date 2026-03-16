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
  const [showEndDialog, setShowEndDialog] = useState(false);
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

  // CRITICAL: getUserMedia must be called directly from a user click handler
  const handleJoinCall = useCallback(async () => {
    if (!callId || !user?.id) return;
    try {
      await webrtc.connect();
      setMediaReady(true);
    } catch (err) {
      console.error("WebRTC connect failed:", err);
      toast.error("ক্যামেরা/মাইক্রোফোন অ্যাক্সেস করা যায়নি। অনুগ্রহ করে ব্রাউজার পারমিশন চেক করুন।");
    }
  }, [callId, user?.id, webrtc]);

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
    setShowEndDialog(false);

    // Broadcast hangup to remote party
    webrtc.broadcastHangup();

    // Stop recording if active
    let recordingBlob: Blob | null = null;
    if (recorder.isRecording) {
      recordingBlob = await recorder.stopRecording();
    }

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
      toast.error(e.message || "Failed to complete call");
      callEndedRef.current = false;
      setIsActive(true);
    }

    webrtc.disconnect();
  }, [callId, elapsed, pricePerMin, fees.callFeePercent, completeCall, refreshProfile, recorder, webrtc]);

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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Minimal nav */}
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm z-10">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Video className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-lg text-foreground">CallGuru</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="bg-card border border-border rounded-lg px-3 py-1.5 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="font-heading font-bold text-foreground tabular-nums text-sm">
                {formatTime(elapsed)}
              </span>
            </div>
            <div className="bg-card border border-border rounded-lg px-3 py-1.5">
              <span className="text-sm font-medium text-primary">৳{runningCost.toFixed(2)}</span>
            </div>
            <motion.div
              className="w-2.5 h-2.5 rounded-full bg-accent"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
          </div>
        </div>
      </nav>

      {/* Video area */}
      <div className="flex-1 relative bg-muted/30">
        {!mediaReady ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
            <Avatar className="w-28 h-28 ring-4 ring-primary/20">
              <AvatarImage src={providerAvatar || undefined} />
              <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h2 className="font-heading text-xl font-bold text-foreground">{providerName}</h2>
              <p className="text-muted-foreground text-sm">{serviceName}</p>
            </div>
            <Button variant="hero" size="lg" onClick={handleJoinCall} className="gap-2">
              <Video className="w-5 h-5" />
              কলে যোগ দিন
            </Button>
            <p className="text-xs text-muted-foreground max-w-xs text-center">
              বাটনে ক্লিক করলে আপনার ক্যামেরা ও মাইক্রোফোন চালু হবে
            </p>
          </div>
        ) : (
          <>
            {/* Remote video (full screen) */}
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
                style={{
                  display: hasRemoteVideo ? "block" : "none",
                }}
              />

              {/* Fallback avatar when no remote video */}
              {!hasRemoteVideo && (
                <div className="flex flex-col items-center gap-4">
                  <Avatar className="w-32 h-32 ring-4 ring-primary/20">
                    <AvatarImage src={providerAvatar || undefined} />
                    <AvatarFallback className="text-4xl bg-primary/10 text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                    <h2 className="font-heading text-xl font-bold text-foreground">{providerName}</h2>
                    <p className="text-muted-foreground text-sm">{serviceName}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {webrtc.connectionState === "connected" 
                        ? "কানেক্টেড ✓ — অডিও কল চলছে"
                        : webrtc.connectionState === "connecting" 
                          ? "কানেক্ট হচ্ছে…"
                          : webrtc.connectionState === "failed"
                            ? "কানেকশন ব্যর্থ — পুনরায় চেষ্টা করা হচ্ছে…"
                            : "অপর পক্ষের জন্য অপেক্ষা করা হচ্ছে…"}
                    </p>
                  </div>
                </div>
              )}

              {/* Hidden audio element for remote audio */}
              <video
                ref={remoteAudioRef}
                autoPlay
                playsInline
                style={{ position: "absolute", width: 0, height: 0, opacity: 0 }}
              />
            </div>

            {/* Local video (picture-in-picture) */}
            {webrtc.localStream && (
              <div className="absolute top-4 right-4 w-40 h-28 sm:w-52 sm:h-36 rounded-xl overflow-hidden border-2 border-border shadow-elevated bg-card z-10">
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
                  <div className="w-full h-full flex items-center justify-center">
                    <VideoOff className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
              </div>
            )}

            {/* Connection status badge */}
            {mediaReady && webrtc.connectionState !== "connected" && (
              <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10">
                <div className="bg-card/90 backdrop-blur-sm border border-border rounded-full px-4 py-2 text-xs text-muted-foreground flex items-center gap-2">
                  <motion.div
                    className="w-2 h-2 rounded-full bg-primary"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  />
                  {webrtc.connectionState === "connecting" ? "কানেক্ট হচ্ছে…" : 
                   webrtc.connectionState === "failed" ? "পুনরায় চেষ্টা হচ্ছে…" :
                   "অপর পক্ষের জন্য অপেক্ষা…"}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Controls bar */}
      {isActive && mediaReady && (
        <div className="border-t border-border bg-card p-4">
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={webrtc.toggleAudio}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                webrtc.isAudioEnabled
                  ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  : "bg-destructive/20 text-destructive"
              }`}
            >
              {webrtc.isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>

            <button
              onClick={webrtc.toggleVideo}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                webrtc.isVideoEnabled
                  ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  : "bg-destructive/20 text-destructive"
              }`}
            >
              {webrtc.isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>

            {/* Switch Camera (front/back) */}
            <button
              onClick={webrtc.switchCamera}
              className="w-12 h-12 rounded-full flex items-center justify-center bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
            >
              <SwitchCamera className="w-5 h-5" />
            </button>

            <button
              onClick={webrtc.toggleScreenShare}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                webrtc.isScreenSharing
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              <MonitorUp className="w-5 h-5" />
            </button>

            <button
              onClick={() => setShowEndDialog(true)}
              className="w-14 h-14 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-lg hover:bg-destructive/90 transition-colors"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </div>
          <div className="flex justify-center gap-4 mt-2 text-xs text-muted-foreground">
            <span>Mic</span>
            <span>Camera</span>
            <span>Flip</span>
            <span>Screen</span>
            <span>End</span>
          </div>
        </div>
      )}

      {/* Confirm end dialog */}
      <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>End Call?</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration</span>
                <span className="font-medium text-foreground">{durationMinutes} min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Cost</span>
                <span className="font-medium text-foreground">৳{runningCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Platform Fee ({fees.callFeePercent}%)</span>
                <span className="text-muted-foreground">৳{feeAmount.toFixed(2)}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              ৳{runningCost.toFixed(2)} will be deducted from your wallet.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setShowEndDialog(false)}>Continue Call</Button>
            <Button
              variant="destructive"
              onClick={handleEndCall}
              disabled={completeCall.isPending}
            >
              <PhoneOff className="w-4 h-4 mr-2" />
              {completeCall.isPending ? "Ending…" : "End Call"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Call summary dialog with rating */}
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

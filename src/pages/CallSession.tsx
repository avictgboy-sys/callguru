import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCompleteCall } from "@/hooks/useCalls";
import { useFeeSettings } from "@/hooks/useAppSettings";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Video, PhoneOff, Clock, Star } from "lucide-react";
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

  const callId = params.get("id");
  const providerName = params.get("provider") || "Expert";
  const providerAvatar = params.get("avatar") || "";
  const serviceName = params.get("service") || "Consultation";
  const pricePerMin = parseFloat(params.get("rate") || "0");

  const [elapsed, setElapsed] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState<{
    duration: number;
    totalCost: number;
    fee: number;
    net: number;
  } | null>(null);

  // Timer
  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, [isActive]);

  const durationMinutes = Math.max(Math.ceil(elapsed / 60), 1);
  const runningCost = durationMinutes * pricePerMin;
  const feeAmount = runningCost * (fees.callFeePercent / 100);

  const handleEndCall = useCallback(async () => {
    if (!callId) return;
    setIsActive(false);
    setShowEndDialog(false);

    const mins = Math.max(Math.ceil(elapsed / 60), 1);
    const total = mins * pricePerMin;
    const fee = Math.round(total * (fees.callFeePercent / 100) * 100) / 100;

    try {
      await completeCall.mutateAsync({
        call_id: callId,
        duration_minutes: mins,
      });
      await refreshProfile();
      setSummary({
        duration: mins,
        totalCost: total,
        fee,
        net: total - fee,
      });
      setShowSummary(true);
    } catch (e: any) {
      toast.error(e.message || "Failed to complete call");
      setIsActive(true);
    }
  }, [callId, elapsed, pricePerMin, fees.callFeePercent, completeCall, refreshProfile]);

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col">
      {/* Minimal nav */}
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Video className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-lg text-foreground">CallGuru</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Session active</span>
            <motion.div
              className="w-2.5 h-2.5 rounded-full bg-accent"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
          </div>
        </div>
      </nav>

      {/* Main call area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {/* Provider info */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center mb-8"
        >
          <Avatar className="w-28 h-28 mx-auto mb-4 ring-4 ring-primary/20">
            <AvatarImage src={providerAvatar || undefined} />
            <AvatarFallback className="text-3xl bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <h2 className="font-heading text-2xl font-bold text-foreground">{providerName}</h2>
          <p className="text-muted-foreground text-sm mt-1">{serviceName}</p>
        </motion.div>

        {/* Timer */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <div className="bg-card rounded-2xl border border-border shadow-elevated px-10 py-6 inline-block">
            <div className="flex items-center gap-2 justify-center mb-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Duration</span>
            </div>
            <p className="font-heading text-5xl font-bold text-foreground tabular-nums">
              {formatTime(elapsed)}
            </p>
          </div>
        </motion.div>

        {/* Running cost */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-3 gap-4 mb-10 w-full max-w-sm"
        >
          <div className="bg-card rounded-xl border border-border p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Rate</p>
            <p className="font-heading font-bold text-foreground">৳{pricePerMin}</p>
            <p className="text-xs text-muted-foreground">/min</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Running Cost</p>
            <p className="font-heading font-bold text-primary">৳{runningCost.toFixed(2)}</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Fee ({fees.callFeePercent}%)</p>
            <p className="font-heading font-bold text-muted-foreground">৳{feeAmount.toFixed(2)}</p>
          </div>
        </motion.div>

        {/* End call button */}
        {isActive && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, type: "spring" }}
          >
            <button
              onClick={() => setShowEndDialog(true)}
              className="w-20 h-20 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-lg hover:bg-destructive/90 transition-colors"
            >
              <PhoneOff className="w-8 h-8" />
            </button>
            <p className="text-xs text-muted-foreground text-center mt-3">End Call</p>
          </motion.div>
        )}
      </div>

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

      {/* Call summary dialog */}
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
            </div>
          )}
          <DialogFooter>
            <Button variant="hero" className="w-full" onClick={() => navigate("/dashboard")}>
              Back to Dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CallSession;

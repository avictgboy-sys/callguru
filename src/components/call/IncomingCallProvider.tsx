import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Phone, PhoneOff, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface IncomingCall {
  id: string;
  caller_id: string;
  service_id: string;
  price_per_minute: number;
  callerName: string;
  callerAvatar: string;
  serviceName: string;
}

interface IncomingCallContextType {
  activeIncomingCall: IncomingCall | null;
}

const IncomingCallContext = createContext<IncomingCallContextType>({
  activeIncomingCall: null,
});

export const useIncomingCall = () => useContext(IncomingCallContext);

// Simple ringtone using Web Audio API
const playRingtone = () => {
  const audioCtx = new AudioContext();
  let stopped = false;

  const ring = () => {
    if (stopped) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = 440;
    gain.gain.value = 0.3;
    osc.start();
    osc.stop(audioCtx.currentTime + 0.4);

    setTimeout(() => {
      if (stopped) return;
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.frequency.value = 520;
      gain2.gain.value = 0.3;
      osc2.start();
      osc2.stop(audioCtx.currentTime + 0.4);
    }, 500);

    setTimeout(() => ring(), 2000);
  };

  ring();

  return () => {
    stopped = true;
    audioCtx.close();
  };
};

export const IncomingCallProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const stopRingtoneRef = useRef<(() => void) | null>(null);

  // Listen for new calls where current user is the provider
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("incoming-calls")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "calls",
          filter: `provider_id=eq.${user.id}`,
        },
        async (payload) => {
          const call = payload.new as any;
          if (call.status !== "active") return;

          // Fetch caller profile and service info
          const [profileRes, serviceRes] = await Promise.all([
            supabase
              .from("profiles")
              .select("full_name, avatar_url")
              .eq("user_id", call.caller_id)
              .single(),
            supabase
              .from("services")
              .select("title")
              .eq("id", call.service_id)
              .single(),
          ]);

          setIncomingCall({
            id: call.id,
            caller_id: call.caller_id,
            service_id: call.service_id,
            price_per_minute: call.price_per_minute,
            callerName: profileRes.data?.full_name || "Unknown",
            callerAvatar: profileRes.data?.avatar_url || "",
            serviceName: serviceRes.data?.title || "Consultation",
          });

          // Start ringtone
          stopRingtoneRef.current = playRingtone();

          // Auto-dismiss after 30 seconds
          setTimeout(() => {
            handleDecline(call.id, true);
          }, 30000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const stopRingtone = () => {
    if (stopRingtoneRef.current) {
      stopRingtoneRef.current();
      stopRingtoneRef.current = null;
    }
  };

  const handleAccept = (call: IncomingCall) => {
    stopRingtone();
    setIncomingCall(null);

    // Broadcast acceptance
    const channel = supabase.channel(`call-status-${call.id}`);
    channel.subscribe(() => {
      channel.send({
        type: "broadcast",
        event: "call-accepted",
        payload: { call_id: call.id },
      });
      // Navigate provider to call page
      const params = new URLSearchParams({
        id: call.id,
        providerId: user!.id,
        provider: call.callerName,
        avatar: call.callerAvatar,
        serviceId: call.service_id,
        service: call.serviceName,
        rate: String(call.price_per_minute),
        role: "provider",
      });
      navigate(`/call?${params.toString()}`);
      setTimeout(() => supabase.removeChannel(channel), 2000);
    });
  };

  const handleDecline = async (callId: string, isTimeout = false) => {
    stopRingtone();
    setIncomingCall(null);

    // Broadcast decline
    const channel = supabase.channel(`call-status-${callId}`);
    channel.subscribe(() => {
      channel.send({
        type: "broadcast",
        event: "call-declined",
        payload: { call_id: callId, reason: isTimeout ? "timeout" : "declined" },
      });
      setTimeout(() => supabase.removeChannel(channel), 2000);
    });

    if (!isTimeout) {
      toast.info("Call declined");
    }
  };

  const callerInitials = incomingCall?.callerName
    ?.split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  return (
    <IncomingCallContext.Provider value={{ activeIncomingCall: incomingCall }}>
      {children}

      {/* Incoming call overlay */}
      <AnimatePresence>
        {incomingCall && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-md flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 30 }}
              className="text-center space-y-8 px-6"
            >
              {/* Pulsing ring around avatar */}
              <div className="relative mx-auto w-36 h-36">
                <motion.div
                  className="absolute inset-0 rounded-full border-4 border-primary/30"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full border-4 border-primary/20"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                  transition={{ repeat: Infinity, duration: 2, delay: 0.3 }}
                />
                <Avatar className="w-36 h-36 ring-4 ring-primary/40">
                  <AvatarImage src={incomingCall.callerAvatar || undefined} />
                  <AvatarFallback className="text-4xl bg-primary/10 text-primary">
                    {callerInitials}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">
                  Incoming Call
                </p>
                <h2 className="font-heading text-3xl font-bold text-foreground">
                  {incomingCall.callerName}
                </h2>
                <p className="text-muted-foreground mt-1">{incomingCall.serviceName}</p>
                <p className="text-sm text-primary mt-2 font-medium">
                  ৳{incomingCall.price_per_minute}/min
                </p>
              </div>

              {/* Accept / Decline buttons */}
              <div className="flex items-center justify-center gap-12">
                <div className="text-center">
                  <button
                    onClick={() => handleDecline(incomingCall.id)}
                    className="w-18 h-18 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-lg hover:bg-destructive/90 transition-all"
                    style={{ width: 72, height: 72 }}
                  >
                    <PhoneOff className="w-8 h-8" />
                  </button>
                  <p className="text-xs text-muted-foreground mt-2">Decline</p>
                </div>

                <div className="text-center">
                  <motion.button
                    onClick={() => handleAccept(incomingCall)}
                    className="rounded-full bg-accent text-accent-foreground flex items-center justify-center shadow-lg hover:bg-accent/90 transition-all"
                    style={{ width: 72, height: 72 }}
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    <Phone className="w-8 h-8" />
                  </motion.button>
                  <p className="text-xs text-muted-foreground mt-2">Accept</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </IncomingCallContext.Provider>
  );
};

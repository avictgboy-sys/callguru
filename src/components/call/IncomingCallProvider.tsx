import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Phone, PhoneOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { usePushNotifications } from "@/hooks/usePushNotifications";

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

// Improved ringtone using Web Audio API
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
  const notificationRef = useRef<Notification | null>(null);
  const vibrationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { showCallNotification, vibrate, stopVibration } = usePushNotifications();

  // Register custom service worker for push notifications
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/custom-sw.js", { scope: "/" }).catch(() => {
        // Silent fail - PWA service worker from vite-plugin-pwa will handle caching
      });

      // Listen for messages from service worker (call accept/decline from notification)
      const handler = (event: MessageEvent) => {
        if (event.data?.type === "CALL_ACCEPTED" && incomingCall) {
          handleAccept(incomingCall);
        } else if (event.data?.type === "CALL_DECLINED" && incomingCall) {
          handleDecline(incomingCall.id);
        }
      };
      navigator.serviceWorker.addEventListener("message", handler);
      return () => navigator.serviceWorker.removeEventListener("message", handler);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingCall]);

  // Start repeating vibration pattern
  const startVibration = () => {
    vibrate([300, 200, 300, 200, 300]);
    vibrationIntervalRef.current = setInterval(() => {
      vibrate([300, 200, 300, 200, 300]);
    }, 2000);
  };

  const stopAllVibration = () => {
    stopVibration();
    if (vibrationIntervalRef.current) {
      clearInterval(vibrationIntervalRef.current);
      vibrationIntervalRef.current = null;
    }
  };

  // Process a new incoming call
  const processIncomingCall = useCallback(async (call: any) => {
    if (call.status !== "active") return;
    // Don't show if we already have this call
    if (incomingCall?.id === call.id) return;

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

    const callerName = profileRes.data?.full_name || "Unknown";
    const serviceName = serviceRes.data?.title || "Consultation";

    setIncomingCall({
      id: call.id,
      caller_id: call.caller_id,
      service_id: call.service_id,
      price_per_minute: call.price_per_minute,
      callerName,
      callerAvatar: profileRes.data?.avatar_url || "",
      serviceName,
    });

    stopRingtoneRef.current = playRingtone();
    startVibration();
    notificationRef.current = showCallNotification(callerName, serviceName, call.id);

    setTimeout(() => {
      handleDecline(call.id, true);
    }, 30000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingCall?.id]);

  // Listen for new calls via Realtime + Polling fallback
  useEffect(() => {
    if (!user) return;
    let isActive = true;
    const seenCallIds = new Set<string>();

    // Primary: Realtime subscription
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
          seenCallIds.add(call.id);
          await processIncomingCall(call);
        }
      )
      .subscribe((status, err) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.warn("Realtime channel issue:", status, err);
        }
      });

    // Fallback: Poll every 3 seconds for active calls targeting this provider
    const pollInterval = setInterval(async () => {
      if (!isActive) return;
      try {
        const { data } = await supabase
          .from("calls")
          .select("*")
          .eq("provider_id", user.id)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1);

        if (data && data.length > 0) {
          const call = data[0];
          // Only process if we haven't seen this call via realtime
          if (!seenCallIds.has(call.id)) {
            // Check if call is recent (within last 35 seconds)
            const callAge = Date.now() - new Date(call.created_at).getTime();
            if (callAge < 35000) {
              seenCallIds.add(call.id);
              await processIncomingCall(call);
            }
          }
        }
      } catch (e) {
        // Silent fail for polling
      }
    }, 3000);

    return () => {
      isActive = false;
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, processIncomingCall]);

  const stopAll = () => {
    if (stopRingtoneRef.current) {
      stopRingtoneRef.current();
      stopRingtoneRef.current = null;
    }
    stopAllVibration();
    if (notificationRef.current) {
      notificationRef.current.close();
      notificationRef.current = null;
    }
  };

  const handleAccept = (call: IncomingCall) => {
    stopAll();
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
    stopAll();
    setIncomingCall(null);

    // Update call status to missed/declined in database
    const newStatus = isTimeout ? "missed" : "declined";
    await supabase
      .from("calls")
      .update({ status: newStatus, ended_at: new Date().toISOString() } as any)
      .eq("id", callId);

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

      {/* Incoming call fullscreen overlay */}
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
                <motion.p
                  className="text-sm text-muted-foreground uppercase tracking-wider mb-2"
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  📞 ইনকামিং কল
                </motion.p>
                <h2 className="font-heading text-3xl font-bold text-foreground">
                  {incomingCall.callerName}
                </h2>
                <p className="text-muted-foreground mt-1">{incomingCall.serviceName}</p>
                <p className="text-sm text-primary mt-2 font-medium">
                  ৳{incomingCall.price_per_minute}/min
                </p>
              </div>

              {/* Accept / Decline buttons */}
              <div className="flex items-center justify-center gap-16">
                <div className="text-center">
                  <motion.button
                    onClick={() => handleDecline(incomingCall.id)}
                    className="rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-lg"
                    style={{ width: 72, height: 72 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <PhoneOff className="w-8 h-8" />
                  </motion.button>
                  <p className="text-xs text-muted-foreground mt-3">বাতিল</p>
                </div>

                <div className="text-center">
                  <motion.button
                    onClick={() => handleAccept(incomingCall)}
                    className="rounded-full bg-accent text-accent-foreground flex items-center justify-center shadow-lg"
                    style={{ width: 72, height: 72 }}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Phone className="w-8 h-8" />
                  </motion.button>
                  <p className="text-xs text-muted-foreground mt-3">রিসিভ</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </IncomingCallContext.Provider>
  );
};

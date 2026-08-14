import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCallState } from "@/hooks/useCallState";
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

// Ringtone using Web Audio API
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
  const location = useLocation();
  const callState = useCallState();
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const stopRingtoneRef = useRef<(() => void) | null>(null);
  const notificationRef = useRef<Notification | null>(null);
  const vibrationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoDeclineTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { showCallNotification, vibrate, stopVibration } = usePushNotifications();

  // Register custom service worker
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/custom-sw.js", { scope: "/" }).catch(() => {});

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

  const startVibration = () => {
    vibrate([300, 200, 300, 200, 300]);
    vibrationIntervalRef.current = setInterval(() => {
      vibrate([300, 200, 300, 200, 300]);
    }, 2000);
  };

  const stopAllAlerts = () => {
    if (stopRingtoneRef.current) {
      stopRingtoneRef.current();
      stopRingtoneRef.current = null;
    }
    stopVibration();
    if (vibrationIntervalRef.current) {
      clearInterval(vibrationIntervalRef.current);
      vibrationIntervalRef.current = null;
    }
    if (notificationRef.current) {
      notificationRef.current.close();
      notificationRef.current = null;
    }
    if (autoDeclineTimerRef.current) {
      clearTimeout(autoDeclineTimerRef.current);
      autoDeclineTimerRef.current = null;
    }
  };

  // Process incoming call
  const processIncomingCall = useCallback(async (call: any) => {
    if (call.status !== "active") return;
    if (incomingCall?.id === call.id) return;

    // BUSY CHECK: If already in a call (ringing or connected), auto-decline
    if (callState.isInCall()) {
      // Auto-decline with busy reason
      await supabase
        .from("calls")
        .update({ status: "declined", ended_at: new Date().toISOString() } as any)
        .eq("id", call.id);

      const busyChannel = supabase.channel(`call-status-${call.id}`);
      busyChannel.subscribe(() => {
        busyChannel.send({
          type: "broadcast",
          event: "call-declined",
          payload: { call_id: call.id, reason: "busy" },
        });
        setTimeout(() => supabase.removeChannel(busyChannel), 2000);
      });
      return;
    }

    // Don't show incoming call if already on call page
    if (location.pathname === "/call") return;

    const [profileRes, serviceRes] = await Promise.all([
      supabase
        .from("profiles_public")
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

    callState.setStatus("ringing", call.id);
    stopRingtoneRef.current = playRingtone();
    startVibration();
    notificationRef.current = showCallNotification(callerName, serviceName, call.id);

    // Auto-decline after 30 seconds
    autoDeclineTimerRef.current = setTimeout(() => {
      handleDecline(call.id, true);
    }, 30000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingCall?.id, callState.status, location.pathname]);

  // Listen for calls via Realtime + Polling
  useEffect(() => {
    if (!user) return;
    let isActive = true;
    const seenCallIds = new Set<string>();

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
      .subscribe();

    // Polling fallback every 3s
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
          if (!seenCallIds.has(call.id)) {
            const callAge = Date.now() - new Date(call.created_at).getTime();
            if (callAge < 35000) {
              seenCallIds.add(call.id);
              await processIncomingCall(call);
            }
          }
        }
      } catch (_) {}
    }, 3000);

    return () => {
      isActive = false;
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, processIncomingCall]);

  // Also listen for caller-side cancel (caller hangs up before accept)
  useEffect(() => {
    if (!incomingCall) return;

    const statusChannel = supabase.channel(`call-cancel-watch-${incomingCall.id}`);
    statusChannel
      .on("broadcast", { event: "call-ended" }, () => {
        // Caller cancelled before we accepted
        stopAllAlerts();
        setIncomingCall(null);
        callState.reset();
        toast.info("কলার কল বাতিল করেছে");
      })
      .subscribe();

    return () => {
      supabase.removeChannel(statusChannel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingCall?.id]);

  const handleAccept = (call: IncomingCall) => {
    stopAllAlerts();
    setIncomingCall(null);
    callState.setStatus("connected", call.id);

    // Broadcast acceptance
    const channel = supabase.channel(`call-status-${call.id}`);
    channel.subscribe(() => {
      channel.send({
        type: "broadcast",
        event: "call-accepted",
        payload: { call_id: call.id },
      });
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
    stopAllAlerts();
    setIncomingCall(null);
    callState.reset();

    const newStatus = isTimeout ? "missed" : "declined";
    await supabase
      .from("calls")
      .update({ status: newStatus, ended_at: new Date().toISOString() } as any)
      .eq("id", callId);

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

      {/* IMO-style incoming call fullscreen overlay */}
      <AnimatePresence>
        {incomingCall && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-between overflow-hidden"
          >
            {/* Animated background */}
            <motion.div
              className="absolute inset-0"
              style={{
                background: "radial-gradient(ellipse at 50% 30%, rgba(34,197,94,0.15) 0%, transparent 60%), radial-gradient(ellipse at 50% 80%, rgba(239,68,68,0.08) 0%, transparent 50%)",
              }}
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            />

            {/* Top - "Incoming Call" */}
            <div className="relative z-10 pt-16 text-center">
              <motion.div
                className="flex items-center justify-center gap-2 mb-2"
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <motion.div
                  className="w-2 h-2 rounded-full bg-green-400"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                />
                <span className="text-green-400 text-sm font-medium uppercase tracking-widest">
                  ইনকামিং কল
                </span>
                <motion.div
                  className="w-2 h-2 rounded-full bg-green-400"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ repeat: Infinity, duration: 1, delay: 0.5 }}
                />
              </motion.div>
              <p className="text-white/40 text-xs">{incomingCall.serviceName}</p>
            </div>

            {/* Center - Avatar with ripple */}
            <div className="relative z-10 flex flex-col items-center gap-6">
              <div className="relative w-40 h-40">
                {[0, 0.4, 0.8].map((delay, i) => (
                  <motion.div
                    key={i}
                    className="absolute inset-0 rounded-full border-2 border-green-400/30"
                    animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
                    transition={{ repeat: Infinity, duration: 2.4, delay, ease: "easeOut" }}
                  />
                ))}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{ background: "radial-gradient(circle, rgba(34,197,94,0.25) 0%, transparent 70%)" }}
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
                <Avatar className="w-40 h-40 ring-4 ring-green-400/30 shadow-2xl shadow-green-500/20">
                  <AvatarImage src={incomingCall.callerAvatar || undefined} />
                  <AvatarFallback className="text-5xl bg-white/10 text-white font-bold">
                    {callerInitials}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className="text-center">
                <h2 className="text-white text-3xl font-bold tracking-tight">
                  {incomingCall.callerName}
                </h2>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className="text-white/50 text-sm">{incomingCall.serviceName}</span>
                  <span className="text-white/30">•</span>
                  <span className="text-green-400 text-sm font-semibold">
                    ৳{incomingCall.price_per_minute}/min
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom - Buttons */}
            <div className="relative z-10 pb-16 w-full px-8">
              <div className="flex items-center justify-between max-w-xs mx-auto">
                <div className="text-center">
                  <motion.button
                    onClick={() => handleDecline(incomingCall.id)}
                    className="w-[70px] h-[70px] rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-500/30"
                    whileTap={{ scale: 0.85 }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <PhoneOff className="w-7 h-7" />
                  </motion.button>
                  <p className="text-white/40 text-xs mt-3 font-medium">বাতিল</p>
                </div>

                <div className="text-center">
                  <motion.button
                    onClick={() => handleAccept(incomingCall)}
                    className="w-[70px] h-[70px] rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg shadow-green-500/30"
                    animate={{
                      scale: [1, 1.12, 1],
                      boxShadow: [
                        "0 10px 25px -5px rgba(34,197,94,0.3)",
                        "0 10px 40px -5px rgba(34,197,94,0.5)",
                        "0 10px 25px -5px rgba(34,197,94,0.3)",
                      ],
                    }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    whileTap={{ scale: 0.85 }}
                  >
                    <Phone className="w-7 h-7" />
                  </motion.button>
                  <p className="text-white/40 text-xs mt-3 font-medium">রিসিভ</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </IncomingCallContext.Provider>
  );
};

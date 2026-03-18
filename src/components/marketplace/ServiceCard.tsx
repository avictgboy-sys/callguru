import { useState } from "react";
import { Star, Clock, Video, BadgeCheck } from "lucide-react";
import { getScheduleStatus } from "@/lib/schedule";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useStartCall } from "@/hooks/useCalls";
import { useCallState } from "@/hooks/useCallState";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ServiceWithProvider } from "@/hooks/useServices";

interface Props {
  service: ServiceWithProvider;
}

const ServiceCard = ({ service }: Props) => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const startCall = useStartCall();
  const callState = useCallState();
  const [ringing, setRinging] = useState(false);
  const providerName = service.profiles?.full_name || "Expert";
  const isVerified = service.profiles?.is_verified;
  const avatarUrl = service.profiles?.avatar_url;
  const categoryName = service.service_categories?.name || "General";
  const scheduleStatus = getScheduleStatus(service.availability_schedule);
  const isBookable = !!service.is_available && scheduleStatus.available;

  const handleBookCall = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (user.id === service.provider_id) {
      toast.error("You can't call yourself!");
      return;
    }

    // Block if already in a call
    if (callState.isInCall()) {
      toast.error("আপনি ইতিমধ্যে একটি কলে আছেন।");
      return;
    }

    const balance = profile?.wallet_balance ?? 0;
    if (balance < service.price_per_minute) {
      toast.error("Insufficient balance. Please top up your wallet first.");
      navigate("/wallet");
      return;
    }
    try {
      const call = await startCall.mutateAsync({
        provider_id: service.provider_id,
        service_id: service.id,
        price_per_minute: service.price_per_minute,
      });

      setRinging(true);
      callState.setStatus("ringing", call.id);
      toast.info("Ringing provider...");

      // Listen for provider's response
      const statusChannel = supabase.channel(`call-status-${call.id}`);
      let responded = false;

      statusChannel
        .on("broadcast", { event: "call-accepted" }, () => {
          responded = true;
          setRinging(false);
          callState.setStatus("connected", call.id);
          supabase.removeChannel(statusChannel);
          const params = new URLSearchParams({
            id: call.id,
            providerId: service.provider_id,
            provider: providerName,
            avatar: avatarUrl || "",
            serviceId: service.id,
            service: service.title,
            rate: String(service.price_per_minute),
          });
          navigate(`/call?${params.toString()}`);
        })
        .on("broadcast", { event: "call-declined" }, ({ payload }) => {
          responded = true;
          setRinging(false);
          callState.reset();
          supabase.removeChannel(statusChannel);

          if (payload?.reason === "busy") {
            toast.error("প্রোভাইডার এখন ব্যস্ত। কিছুক্ষণ পর চেষ্টা করুন।");
          } else if (payload?.reason === "timeout") {
            toast.error("Provider didn't answer. Try again later.");
          } else {
            toast.error("Provider declined the call.");
          }
        })
        .subscribe();

      // Timeout after 35s
      setTimeout(() => {
        if (!responded) {
          setRinging(false);
          callState.reset();
          supabase.removeChannel(statusChannel);
          // Cancel the call in DB
          supabase
            .from("calls")
            .update({ status: "missed", ended_at: new Date().toISOString() } as any)
            .eq("id", call.id)
            .then(() => {});
          toast.error("No response from provider. Try again later.");
        }
      }, 35000);
    } catch (e: any) {
      setRinging(false);
      callState.reset();
      toast.error(e.message || "Failed to start call");
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border shadow-card hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 overflow-hidden group">
      {/* Header */}
      <div className="p-5 pb-3">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt={providerName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-lg font-bold text-muted-foreground">
                {providerName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-sm text-foreground truncate">{providerName}</span>
              {isVerified && <BadgeCheck className="w-4 h-4 text-primary flex-shrink-0" />}
            </div>
            <span className="text-xs text-muted-foreground">{categoryName}</span>
          </div>
          <div className="text-right">
            <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${isBookable ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"}`}>
              {!service.is_available ? "Offline" : scheduleStatus.available ? "Live" : "Scheduled"}
            </div>
            {!scheduleStatus.available && service.is_available && (
              <p className="text-[10px] text-muted-foreground mt-0.5">{scheduleStatus.message}</p>
            )}
          </div>
        </div>

        <h3 className="font-heading font-semibold text-foreground mb-1 line-clamp-1">
          {service.title}
        </h3>
        {service.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{service.description}</p>
        )}
      </div>

      {/* Tags */}
      {service.tags && service.tags.length > 0 && (
        <div className="px-5 pb-3 flex flex-wrap gap-1.5">
          {service.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-md">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="px-5 py-3 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5" style={{ color: 'hsl(var(--star))', fill: 'hsl(var(--star))' }} />
            <span className="text-sm font-medium text-foreground">
              {(service.rating ?? 0).toFixed(1)}
            </span>
            <span className="text-xs text-muted-foreground">({service.total_reviews ?? 0})</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Video className="w-3.5 h-3.5" />
            {service.total_sessions ?? 0} sessions
          </div>
        </div>
        <div className="text-right">
          <span className="font-heading font-bold text-primary text-lg">
            ৳{service.price_per_minute}
          </span>
          <span className="text-xs text-muted-foreground">/min</span>
        </div>
      </div>

      {/* CTA */}
      <div className="px-5 pb-5">
        <Button
          variant="hero"
          className="w-full"
          size="sm"
          disabled={!isBookable || startCall.isPending || ringing || callState.isInCall()}
          onClick={handleBookCall}
        >
          <Video className="w-4 h-4 mr-1" />
          {callState.isInCall() && !ringing
            ? "কলে আছেন"
            : ringing
              ? "Ringing…"
              : startCall.isPending
                ? "Starting…"
                : isBookable
                  ? "Book Consultation"
                  : !service.is_available
                    ? "Provider Offline"
                    : "Outside Schedule"}
        </Button>
      </div>
    </div>
  );
};

export default ServiceCard;

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSetting } from "@/hooks/useAppSettings";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";

/**
 * Displays a self-serve ad from the database.
 * Tracks impressions and awards points to the viewer.
 */
const SelfServeAdCard = ({ ad }: { ad: any }) => {
  const { user } = useAuth();
  const pointsPerView = parseInt(useSetting("ad_points_per_view") || "2", 10);

  const handleClick = async () => {
    if (!ad.link_url) return;

    // Track click
    try {
      await supabase
        .from("self_ads" as any)
        .update({ clicks: (ad.clicks || 0) + 1 } as any)
        .eq("id", ad.id);
    } catch {}

    window.open(ad.link_url, "_blank");
  };

  // Track impression on mount
  const trackImpression = async () => {
    try {
      await supabase
        .from("self_ads" as any)
        .update({ 
          impressions: (ad.impressions || 0) + 1,
          spent: (ad.spent || 0) + ((ad.budget || 0) / Math.max(1, Math.floor((ad.budget / parseFloat(useSetting("ad_cost_per_1000") || "50")) * 1000)))
        } as any)
        .eq("id", ad.id);

      // Award points to viewer
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("points")
          .eq("user_id", user.id)
          .single();
        if (profile) {
          await supabase
            .from("profiles")
            .update({ points: (profile.points || 0) + pointsPerView })
            .eq("user_id", user.id);
        }

        await supabase.from("ad_views" as any).insert({
          user_id: user.id,
          ad_slot: `self-ad-${ad.id}`,
        } as any);
      }
    } catch {}
  };

  // Use ref for one-time tracking
  const tracked = { current: false };
  if (!tracked.current) {
    tracked.current = true;
    trackImpression();
  }

  if (ad.ad_type === "sponsored") {
    return (
      <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
        <div className="flex items-center justify-between p-4 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">AD</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{ad.title}</p>
              <Badge variant="secondary" className="text-[10px]">Sponsored</Badge>
            </div>
          </div>
        </div>
        {ad.description && (
          <p className="px-4 pb-3 text-sm text-foreground">{ad.description}</p>
        )}
        {ad.image_url && (
          <img
            src={ad.image_url}
            alt={ad.title}
            className="w-full object-cover max-h-[400px] cursor-pointer"
            onClick={handleClick}
          />
        )}
        {ad.video_url && (
          <video src={ad.video_url} controls className="w-full max-h-[400px]" />
        )}
        {ad.link_url && (
          <div className="p-3 border-t border-border">
            <button
              onClick={handleClick}
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              আরো জানুন
            </button>
          </div>
        )}
      </div>
    );
  }

  // Banner ad
  return (
    <div
      className="rounded-2xl border border-border bg-card overflow-hidden cursor-pointer"
      onClick={handleClick}
    >
      <div className="relative">
        {ad.image_url ? (
          <img src={ad.image_url} alt={ad.title} className="w-full object-cover max-h-[200px]" />
        ) : (
          <div className="h-[120px] bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
            <p className="text-lg font-bold text-foreground">{ad.title}</p>
          </div>
        )}
        <div className="absolute top-2 left-2">
          <Badge variant="secondary" className="text-[10px] bg-background/80 backdrop-blur">
            Sponsored
          </Badge>
        </div>
      </div>
      {(ad.description || ad.title) && (
        <div className="p-3">
          {ad.image_url && <p className="text-sm font-medium text-foreground">{ad.title}</p>}
          {ad.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{ad.description}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default SelfServeAdCard;

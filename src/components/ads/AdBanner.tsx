import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSetting } from "@/hooks/useAppSettings";
import { toast } from "sonner";

interface Props {
  slotId: string;
  className?: string;
}

/**
 * Inline ad banner for feed. 
 * If Adsterra script ID is configured, it loads the native banner.
 * Otherwise shows a styled placeholder.
 * Awards points on view (once per slot per session).
 */
const AdBanner = ({ slotId, className = "" }: Props) => {
  const { user } = useAuth();
  const adRef = useRef<HTMLDivElement>(null);
  const pointsAwarded = useRef(false);
  const pointsPerView = parseInt(useSetting("ad_points_per_view") || "2", 10);
  const dailyLimit = parseInt(useSetting("ad_daily_limit") || "50", 10);
  const adsterraId = useSetting("adsterra_banner_id");

  const awardPoints = useCallback(async () => {
    if (!user || pointsAwarded.current) return;
    pointsAwarded.current = true;

    try {
      // Check daily limit
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from("ad_views" as any)
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", today.toISOString());

      if ((count || 0) >= dailyLimit) return;

      // Record view
      await supabase.from("ad_views" as any).insert({
        user_id: user.id,
        ad_slot: slotId,
      } as any);

      // Award points
      await supabase
        .from("profiles")
        .update({ points: undefined }) // We'll use RPC-like raw update
        .eq("user_id", user.id);

      // Actually increment points via raw approach
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

      toast.success(`+${pointsPerView} পয়েন্ট earned!`, { duration: 2000 });
    } catch {
      // Silent fail for ad points
    }
  }, [user, slotId, pointsPerView, dailyLimit]);

  useEffect(() => {
    if (!adRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Award points when ad comes into view
          const timer = setTimeout(() => awardPoints(), 2000); // 2s view = counted
          return () => clearTimeout(timer);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(adRef.current);
    return () => observer.disconnect();
  }, [awardPoints]);

  // Load Adsterra script if configured
  useEffect(() => {
    if (!adsterraId || !adRef.current) return;

    try {
      const script = document.createElement("script");
      script.src = `//pl${adsterraId}.profitablegatecpm.com/${adsterraId}/invoke.js`;
      script.async = true;
      script.dataset.cfasync = "false";
      adRef.current.appendChild(script);
    } catch {
      // Silent fail
    }
  }, [adsterraId]);

  return (
    <div
      ref={adRef}
      className={`rounded-2xl border border-border bg-card overflow-hidden ${className}`}
    >
      {adsterraId ? (
        <div id={`ad-container-${slotId}`} className="min-h-[100px] flex items-center justify-center">
          {/* Adsterra will inject ad here */}
          <div id={adsterraId}></div>
        </div>
      ) : (
        /* Placeholder ad when no Adsterra ID configured */
        <div className="p-4 flex flex-col items-center justify-center min-h-[120px] bg-gradient-to-br from-primary/5 to-accent/10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <span className="text-primary font-bold text-xs">AD</span>
            </div>
            <span className="text-xs font-medium text-muted-foreground">Sponsored</span>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            বিজ্ঞাপন দেখুন এবং পয়েন্ট আয় করুন
          </p>
          <p className="text-xs text-primary mt-1 font-medium">
            +{pointsPerView} পয়েন্ট per view
          </p>
        </div>
      )}
    </div>
  );
};

export default AdBanner;

import { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSetting } from "@/hooks/useAppSettings";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  slotId: string;
}

/**
 * Interstitial ad shown before viewing content (video/image).
 * Shows countdown then allows skip. Awards points after full view.
 */
const InterstitialAd = ({ open, onClose, slotId }: Props) => {
  const { user } = useAuth();
  const [countdown, setCountdown] = useState(5);
  const [canSkip, setCanSkip] = useState(false);
  const pointsPerView = parseInt(useSetting("ad_points_per_view") || "2", 10);
  const dailyLimit = parseInt(useSetting("ad_daily_limit") || "50", 10);
  const adsterraId = useSetting("adsterra_interstitial_id");
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      setCountdown(5);
      setCanSkip(false);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanSkip(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [open]);

  const awardPoints = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await supabase.rpc("increment_ad_points", {
        p_user_id: user.id,
        p_ad_slot: slotId,
        p_points: pointsPerView,
        p_daily_limit: dailyLimit,
      });

      if (data) {
        toast.success(`+${pointsPerView} পয়েন্ট earned!`, { duration: 2000 });
      }
    } catch {
      // silent
    }
  }, [user, slotId, pointsPerView, dailyLimit]);

  // Award points when countdown ends
  useEffect(() => {
    if (canSkip && open) {
      awardPoints();
    }
  }, [canSkip, open, awardPoints]);

  // Prevent injected interstitial from overflowing on mobile
  useEffect(() => {
    if (!open) return;
    const root = contentRef.current;
    if (!root) return;

    const fix = (el: HTMLElement) => {
      const targets = el.matches("iframe, img, video")
        ? [el]
        : (Array.from(el.querySelectorAll("iframe, img, video")) as HTMLElement[]);

      targets.forEach((t) => {
        t.style.maxWidth = "100%";
        t.style.boxSizing = "border-box";
        if (t.tagName === "IFRAME") {
          t.style.width = "100%";
          t.style.display = "block";
          t.style.border = "0";
        }
      });
    };

    fix(root);
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((n) => {
          if (n instanceof HTMLElement) fix(n);
        });
      }
    });
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [open]);

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && canSkip) handleClose(); }}>
      <DialogContent className="max-w-md p-0 overflow-hidden [&>button]:hidden">
        <div className="relative">
          {/* Close / Skip */}
          <div className="absolute top-3 right-3 z-10">
            {canSkip ? (
              <Button variant="secondary" size="sm" onClick={handleClose}>
                <X className="w-4 h-4 mr-1" />
                Skip Ad
              </Button>
            ) : (
              <div className="bg-background/80 backdrop-blur rounded-full px-3 py-1 text-sm font-medium text-foreground">
                {countdown}s
              </div>
            )}
          </div>

          {/* Ad content */}
          <div className="min-h-[300px] flex flex-col items-center justify-center p-8 bg-gradient-to-br from-primary/5 via-background to-accent/10">
            {adsterraId ? (
              <div id={`interstitial-${slotId}`} className="w-full">
                {/* Adsterra will inject here */}
              </div>
            ) : (
              <>
                <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-4">
                  <span className="text-primary font-bold text-xl">AD</span>
                </div>
                <p className="text-sm text-muted-foreground text-center mb-2">
                  বিজ্ঞাপন দেখে পয়েন্ট আয় করুন
                </p>
                <div className="bg-primary/10 rounded-full px-4 py-1.5 mt-2">
                  <span className="text-sm font-semibold text-primary">
                    +{pointsPerView} পয়েন্ট
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Points banner */}
          <div className="bg-card border-t border-border px-4 py-3 text-center">
            <p className="text-xs text-muted-foreground">
              Sponsored • Ad দেখলে পয়েন্ট যোগ হবে
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InterstitialAd;

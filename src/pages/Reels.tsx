import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Film } from "lucide-react";
import { useReels, useToggleReelLike } from "@/hooks/useReels";
import ReelCard from "@/components/reels/ReelCard";
import ReelComments from "@/components/reels/ReelComments";
import CreateReelDialog from "@/components/reels/CreateReelDialog";
import { AnimatePresence } from "framer-motion";

const Reels = () => {
  const { data: reels, isLoading } = useReels();
  const toggleLike = useToggleReelLike();
  const [activeIndex, setActiveIndex] = useState(0);
  const [commentReelId, setCommentReelId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // IntersectionObserver to detect which reel is in view
  const observerCallback = useCallback((entries: IntersectionObserverEntry[]) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const idx = Number(entry.target.getAttribute("data-index"));
        if (!isNaN(idx)) setActiveIndex(idx);
      }
    });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new IntersectionObserver(observerCallback, {
      root: container,
      threshold: 0.6,
    });
    container.querySelectorAll("[data-index]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [reels, observerCallback]);

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-4">
        <Link to="/feed" className="w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-white" />
        </Link>
        <span className="text-white font-bold text-lg drop-shadow">Reels</span>
        <CreateReelDialog />
      </div>

      {/* Reels container */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Film className="w-12 h-12 text-white/40 animate-pulse" />
        </div>
      ) : !reels?.length ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <Film className="w-16 h-16 text-white/30" />
          <p className="text-white/60 text-lg">No reels yet</p>
          <p className="text-white/40 text-sm">Be the first to post a reel!</p>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="flex-1 overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
          style={{ scrollSnapType: "y mandatory" }}
        >
          {reels.map((reel, i) => (
            <div
              key={reel.id}
              data-index={i}
              className="w-full h-full"
              style={{ height: "100dvh", scrollSnapAlign: "start" }}
            >
              <ReelCard
                reel={reel}
                isActive={i === activeIndex}
                onLike={() => toggleLike.mutate({ reelId: reel.id, isLiked: !!reel.is_liked })}
                onComment={() => setCommentReelId(reel.id)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Comments drawer */}
      <AnimatePresence>
        {commentReelId && (
          <ReelComments reelId={commentReelId} onClose={() => setCommentReelId(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Reels;

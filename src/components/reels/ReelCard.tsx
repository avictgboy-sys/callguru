import { useRef, useEffect, useState, useCallback } from "react";
import { Heart, MessageCircle, Share2, Music, Play, Trash2, Eye, Volume2, VolumeX } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import type { Reel } from "@/hooks/useReels";

interface ReelCardProps {
  reel: Reel;
  isActive: boolean;
  isOwner: boolean;
  onLike: () => void;
  onComment: () => void;
  onDelete: () => void;
  onView: () => void;
}

const ReelCard = ({ reel, isActive, isOwner, onLike, onComment, onDelete, onView }: ReelCardProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const viewedRef = useRef(false);
  const progressBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!videoRef.current) return;
    if (isActive) {
      videoRef.current.play().catch(() => {});
      setPaused(false);
      if (!viewedRef.current) {
        viewedRef.current = true;
        onView();
      }
    } else {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setProgress(0);
      viewedRef.current = false;
    }
  }, [isActive]);

  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    setProgress((v.currentTime / v.duration) * 100);
  }, []);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    const bar = progressBarRef.current;
    if (!v || !bar || !v.duration) return;
    const rect = bar.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    v.currentTime = pct * v.duration;
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setPaused(false);
    } else {
      videoRef.current.pause();
      setPaused(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setMuted(videoRef.current.muted);
  };

  const handleDoubleTap = () => {
    if (!reel.is_liked) {
      onLike();
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 800);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/reels?id=${reel.id}`;
    if (navigator.share) {
      try { await navigator.share({ title: reel.caption || "Check out this reel!", url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("লিংক কপি হয়েছে!");
    }
  };

  const initials = (reel.profile?.full_name || "U")[0].toUpperCase();

  return (
    <div className="relative w-full h-full snap-start snap-always bg-black flex items-center justify-center">
      <video
        ref={videoRef}
        src={reel.video_url}
        className="absolute inset-0 w-full h-full object-cover"
        loop
        muted={muted}
        playsInline
        onClick={togglePlay}
        onDoubleClick={handleDoubleTap}
        onTimeUpdate={handleTimeUpdate}
      />

      {/* Progress bar at top */}
      <div
        ref={progressBarRef}
        className="absolute top-0 left-0 right-0 z-30 h-1 bg-white/20 cursor-pointer"
        onClick={handleProgressClick}
      >
        <div
          className="h-full bg-primary transition-[width] duration-150 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Play/Pause overlay */}
      <AnimatePresence>
        {paused && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 0.7, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <Play className="w-20 h-20 text-white drop-shadow-lg" fill="white" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Heart burst on double tap */}
      <AnimatePresence>
        {showHeart && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1.5 }}
            exit={{ opacity: 0, scale: 2 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <Heart className="w-24 h-24 text-red-500 drop-shadow-lg" fill="red" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sound toggle - top right area */}
      <button
        onClick={toggleMute}
        className="absolute top-14 right-4 z-30 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center"
      >
        {muted ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
      </button>

      {/* Right side actions */}
      <div className="absolute right-3 bottom-28 flex flex-col items-center gap-5 z-10">
        <button onClick={onLike} className="flex flex-col items-center gap-1">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center ${reel.is_liked ? 'bg-red-500/20' : 'bg-black/30'} backdrop-blur-sm`}>
            <Heart className={`w-6 h-6 ${reel.is_liked ? 'text-red-500 fill-red-500' : 'text-white'}`} />
          </div>
          <span className="text-white text-xs font-semibold drop-shadow">{reel.likes_count}</span>
        </button>

        <button onClick={onComment} className="flex flex-col items-center gap-1">
          <div className="w-11 h-11 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <span className="text-white text-xs font-semibold drop-shadow">{reel.comments_count}</span>
        </button>

        <button onClick={handleShare} className="flex flex-col items-center gap-1">
          <div className="w-11 h-11 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
            <Share2 className="w-6 h-6 text-white" />
          </div>
          <span className="text-white text-xs font-semibold drop-shadow">Share</span>
        </button>

        <div className="flex flex-col items-center gap-1">
          <div className="w-11 h-11 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
            <Eye className="w-6 h-6 text-white/70" />
          </div>
          <span className="text-white text-xs font-semibold drop-shadow">{reel.views_count}</span>
        </div>

        {isOwner && (
          <button onClick={onDelete} className="flex flex-col items-center gap-1">
            <div className="w-11 h-11 rounded-full bg-red-500/20 backdrop-blur-sm flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-400" />
            </div>
            <span className="text-red-400 text-xs font-semibold drop-shadow">Delete</span>
          </button>
        )}

        <div className="w-10 h-10 rounded-lg border-2 border-white overflow-hidden mt-2 animate-spin" style={{ animationDuration: '3s' }}>
          <div className="w-full h-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Music className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>

      {/* Bottom overlay: author + caption */}
      <div className="absolute bottom-4 left-3 right-16 z-10">
        <div className="flex items-center gap-2 mb-2">
          <Avatar className="w-9 h-9 border-2 border-white">
            <AvatarImage src={reel.profile?.avatar_url || ""} />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">{initials}</AvatarFallback>
          </Avatar>
          <span className="text-white font-bold text-sm drop-shadow">{reel.profile?.full_name || "User"}</span>
          <button className="ml-2 px-3 py-0.5 border border-white rounded text-white text-xs font-semibold">Follow</button>
        </div>
        {reel.caption && (
          <p className="text-white text-sm drop-shadow line-clamp-2">{reel.caption}</p>
        )}
      </div>

      {/* Gradient overlays */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />
    </div>
  );
};

export default ReelCard;

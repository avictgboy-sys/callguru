import { useState, useRef, useEffect, useCallback } from "react";
import { Heart, MessageCircle, Share2, MoreHorizontal, Play, ThumbsUp, Globe, Pencil, Trash2, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useToggleLike, useUpdatePost, useDeletePost } from "@/hooks/useFeed";
import { useIsFollowing, useToggleFollow } from "@/hooks/useFollow";
import type { PostWithAuthor } from "@/hooks/useFeed";
import CommentsSection from "./CommentsSection";
import InterstitialAd from "@/components/ads/InterstitialAd";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** Generates a thumbnail from a video URL by capturing the first frame */
const VideoThumbnail = ({ src, onClick }: { src: string; onClick: () => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [duration, setDuration] = useState<string>("");

  useEffect(() => {
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.src = src;

    video.onloadeddata = () => {
      video.currentTime = 1; // seek to 1s for a better frame
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          setThumbnail(canvas.toDataURL("image/jpeg", 0.8));
        }
      } catch {
        // CORS might block this, fall back to video element
      }

      // Format duration
      const dur = Math.round(video.duration);
      if (dur > 0) {
        const mins = Math.floor(dur / 60);
        const secs = dur % 60;
        setDuration(`${mins}:${secs.toString().padStart(2, "0")}`);
      }
    };

    return () => {
      video.src = "";
    };
  }, [src]);

  return (
    <div
      className="w-full relative cursor-pointer group bg-black"
      onClick={onClick}
    >
      {thumbnail ? (
        <img
          src={thumbnail}
          alt="Video thumbnail"
          className="w-full max-h-[500px] object-cover"
        />
      ) : (
        // Fallback: show muted video as thumbnail
        <video
          ref={videoRef}
          src={src}
          muted
          playsInline
          preload="metadata"
          className="w-full max-h-[500px] object-cover"
        />
      )}

      {/* Play button overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
        <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
          <Play className="w-8 h-8 text-white fill-white ml-1" />
        </div>
      </div>

      {/* Duration badge */}
      {duration && (
        <div className="absolute bottom-3 right-3 bg-black/75 backdrop-blur-sm rounded px-2 py-0.5">
          <span className="text-xs font-medium text-white">{duration}</span>
        </div>
      )}

      {/* Ad badge */}
      <div className="absolute bottom-3 left-3 bg-primary/90 backdrop-blur-sm rounded-full px-2.5 py-1">
        <span className="text-[10px] font-semibold text-primary-foreground">
          🎬 Ad দেখে ভিডিও দেখুন
        </span>
      </div>
    </div>
  );
};

/** Auto-plays video when in viewport, pauses when out */
const AutoPlayVideo = ({ src }: { src: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(video);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <video
      ref={videoRef}
      src={src}
      controls
      muted
      playsInline
      autoPlay
      className="w-full max-h-[500px] object-cover"
    />
  );
};

interface Props {
  post: PostWithAuthor;
}

const PostCard = ({ post }: Props) => {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [showInterstitial, setShowInterstitial] = useState(false);
  const [mediaRevealed, setMediaRevealed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content || "");
  const toggleLike = useToggleLike();
  const updatePost = useUpdatePost();
  const deletePost = useDeletePost();
  const isOwnPost = user?.id === post.user_id;
  const { data: isFollowing } = useIsFollowing(isOwnPost ? undefined : post.user_id);
  const toggleFollow = useToggleFollow();

  const handleMediaClick = () => {
    if (mediaRevealed || !user) {
      setMediaRevealed(true);
      return;
    }
    setShowInterstitial(true);
  };

  const handleAdClose = () => {
    setShowInterstitial(false);
    setMediaRevealed(true);
  };

  const handleLike = async () => {
    if (!user) {
      toast.error("Please log in to like posts");
      return;
    }
    await toggleLike.mutateAsync({ postId: post.id, liked: post.liked_by_me });
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) {
      toast.error("Post content cannot be empty");
      return;
    }
    try {
      await updatePost.mutateAsync({ postId: post.id, content: editContent.trim() });
      toast.success("Post updated!");
      setEditing(false);
    } catch {
      toast.error("Failed to update post");
    }
  };

  const handleDelete = async () => {
    if (!confirm("এই পোস্ট ডিলিট করতে চান?")) return;
    try {
      await deletePost.mutateAsync(post.id);
      toast.success("Post deleted");
    } catch {
      toast.error("Failed to delete post");
    }
  };

  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });
  const authorInitial = (post.author?.full_name || "U")[0].toUpperCase();

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between p-4 pb-2">
        <Link
          to={`/profile/${post.user_id}`}
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
        >
          <Avatar className="w-10 h-10">
            <AvatarImage src={post.author?.avatar_url || ""} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
              {authorInitial}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-[15px] font-semibold text-foreground hover:underline">
                {post.author?.full_name || "Anonymous"}
              </span>
              {post.author?.is_verified && (
                <span className="text-primary text-xs">✓</span>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>{timeAgo}</span>
              <span>·</span>
              <Globe className="w-3 h-3" />
            </div>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          {!isOwnPost && user && (
            <Button
              variant={isFollowing ? "outline" : "default"}
              size="sm"
              className="h-7 text-xs rounded-full px-3"
              onClick={() => toggleFollow.mutate({ targetUserId: post.user_id, isFollowing: !!isFollowing })}
              disabled={toggleFollow.isPending}
            >
              {isFollowing ? "Following" : "Follow"}
            </Button>
          )}
          {isOwnPost ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground h-8 w-8 rounded-full hover:bg-secondary">
                  <MoreHorizontal className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => { setEditing(true); setEditContent(post.content || ""); }}>
                  <Pencil className="w-4 h-4 mr-2" /> Edit Post
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" /> Delete Post
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" size="icon" className="text-muted-foreground h-8 w-8 rounded-full hover:bg-secondary">
              <MoreHorizontal className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {editing ? (
        <div className="px-4 pb-3 space-y-2">
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={3}
            className="text-[15px]"
            autoFocus
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSaveEdit} disabled={updatePost.isPending}>
              <Check className="w-4 h-4 mr-1" /> Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
              <X className="w-4 h-4 mr-1" /> Cancel
            </Button>
          </div>
        </div>
      ) : post.content ? (
        <p className="px-4 pb-3 text-[15px] text-foreground whitespace-pre-wrap leading-relaxed">
          {post.content}
        </p>
      ) : null}

      {/* Image */}
      {post.image_url && (
        <div className="w-full relative cursor-pointer" onClick={handleMediaClick}>
          {!mediaRevealed && user ? (
            <div className="w-full h-[350px] bg-muted/50 backdrop-blur flex flex-col items-center justify-center gap-2">
              <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                <Play className="w-7 h-7 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground font-medium">Ad দেখে কন্টেন্ট দেখুন</p>
            </div>
          ) : (
            <img
              src={post.image_url}
              alt="Post"
              className="w-full object-cover max-h-[500px]"
              loading="lazy"
            />
          )}
        </div>
      )}

      {/* Video */}
      {post.video_url && (
        <>
          {!mediaRevealed ? (
            <VideoThumbnail src={post.video_url} onClick={handleMediaClick} />
          ) : (
            <AutoPlayVideo src={post.video_url} />
          )}
        </>
      )}

      {/* Reaction Stats */}
      {(post.likes_count > 0 || post.comments_count > 0 || post.shares_count > 0) && (
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-1.5">
            {post.likes_count > 0 && (
              <>
                <div className="flex -space-x-1">
                  <div className="w-[18px] h-[18px] rounded-full bg-primary flex items-center justify-center">
                    <ThumbsUp className="w-2.5 h-2.5 text-primary-foreground" />
                  </div>
                  <div className="w-[18px] h-[18px] rounded-full bg-destructive flex items-center justify-center">
                    <Heart className="w-2.5 h-2.5 text-destructive-foreground fill-current" />
                  </div>
                </div>
                <span className="text-[13px] text-muted-foreground">
                  {post.likes_count}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3 text-[13px] text-muted-foreground">
            {post.comments_count > 0 && (
              <button
                onClick={() => setShowComments(!showComments)}
                className="hover:underline"
              >
                {post.comments_count} comment{post.comments_count !== 1 ? "s" : ""}
              </button>
            )}
            {post.shares_count > 0 && (
              <span>{post.shares_count} share{post.shares_count !== 1 ? "s" : ""}</span>
            )}
          </div>
        </div>
      )}

      {/* Actions Bar */}
      <div className="flex items-center border-t border-border mx-4">
        <button
          onClick={handleLike}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[13px] font-semibold rounded-md my-1 transition-colors ${
            post.liked_by_me
              ? "text-primary"
              : "text-muted-foreground hover:bg-secondary"
          }`}
        >
          <ThumbsUp className={`w-5 h-5 ${post.liked_by_me ? "fill-primary" : ""}`} />
          Like
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 text-[13px] font-semibold text-muted-foreground hover:bg-secondary rounded-md my-1 transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          Comment
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-2.5 text-[13px] font-semibold text-muted-foreground hover:bg-secondary rounded-md my-1 transition-colors">
          <Share2 className="w-5 h-5" />
          Share
        </button>
      </div>

      {/* Comments */}
      {showComments && <CommentsSection postId={post.id} />}

      {/* Interstitial Ad */}
      <InterstitialAd
        open={showInterstitial}
        onClose={handleAdClose}
        slotId={`post-media-${post.id}`}
      />
    </div>
  );
};

export default PostCard;

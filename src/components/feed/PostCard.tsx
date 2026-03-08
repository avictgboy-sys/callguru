import { useState } from "react";
import { Heart, MessageCircle, Share2, MoreHorizontal, Play, ThumbsUp, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToggleLike } from "@/hooks/useFeed";
import { useIsFollowing, useToggleFollow } from "@/hooks/useFollow";
import type { PostWithAuthor } from "@/hooks/useFeed";
import CommentsSection from "./CommentsSection";
import InterstitialAd from "@/components/ads/InterstitialAd";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface Props {
  post: PostWithAuthor;
}

const PostCard = ({ post }: Props) => {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [showInterstitial, setShowInterstitial] = useState(false);
  const [mediaRevealed, setMediaRevealed] = useState(false);
  const toggleLike = useToggleLike();

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
        <Button variant="ghost" size="icon" className="text-muted-foreground h-8 w-8 rounded-full hover:bg-secondary">
          <MoreHorizontal className="w-5 h-5" />
        </Button>
      </div>

      {/* Content */}
      {post.content && (
        <p className="px-4 pb-3 text-[15px] text-foreground whitespace-pre-wrap leading-relaxed">
          {post.content}
        </p>
      )}

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
        <div className="w-full relative cursor-pointer" onClick={handleMediaClick}>
          {!mediaRevealed && user ? (
            <div className="w-full h-[350px] bg-muted/50 backdrop-blur flex flex-col items-center justify-center gap-2">
              <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                <Play className="w-7 h-7 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground font-medium">Ad দেখে ভিডিও দেখুন</p>
            </div>
          ) : (
            <video src={post.video_url} controls className="w-full max-h-[500px]" />
          )}
        </div>
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

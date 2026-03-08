import { useState } from "react";
import { Heart, MessageCircle, Share2, MoreHorizontal, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToggleLike } from "@/hooks/useFeed";
import type { PostWithAuthor } from "@/hooks/useFeed";
import CommentsSection from "./CommentsSection";
import InterstitialAd from "@/components/ads/InterstitialAd";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface Props {
  post: PostWithAuthor;
}

const PostCard = ({ post }: Props) => {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const toggleLike = useToggleLike();

  const handleLike = async () => {
    if (!user) {
      toast.error("Please log in to like posts");
      return;
    }
    await toggleLike.mutateAsync({ postId: post.id, liked: post.liked_by_me });
  };

  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });

  return (
    <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-2">
        <Link to={`/profile/${post.user_id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-bold text-primary">
              {(post.author?.full_name || "U")[0].toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {post.author?.full_name || "Anonymous"}
              {post.author?.is_verified && (
                <span className="ml-1 text-primary text-xs">✓</span>
              )}
            </p>
            <p className="text-xs text-muted-foreground">{timeAgo}</p>
          </div>
        </Link>
        <Button variant="ghost" size="icon" className="text-muted-foreground h-8 w-8">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      {post.content && (
        <p className="px-4 pb-3 text-sm text-foreground whitespace-pre-wrap">{post.content}</p>
      )}

      {/* Image */}
      {post.image_url && (
        <div className="w-full">
          <img
            src={post.image_url}
            alt="Post"
            className="w-full object-cover max-h-[500px]"
            loading="lazy"
          />
        </div>
      )}

      {/* Stats */}
      {(post.likes_count > 0 || post.comments_count > 0) && (
        <div className="flex items-center justify-between px-4 py-2 text-xs text-muted-foreground">
          <span>{post.likes_count > 0 ? `${post.likes_count} like${post.likes_count !== 1 ? "s" : ""}` : ""}</span>
          <span>
            {post.comments_count > 0 ? `${post.comments_count} comment${post.comments_count !== 1 ? "s" : ""}` : ""}
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center border-t border-border">
        <button
          onClick={handleLike}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
            post.liked_by_me
              ? "text-destructive"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Heart className={`w-4 h-4 ${post.liked_by_me ? "fill-current" : ""}`} />
          Like
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          Comment
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <Share2 className="w-4 h-4" />
          Share
        </button>
      </div>

      {/* Comments */}
      {showComments && <CommentsSection postId={post.id} />}
    </div>
  );
};

export default PostCard;

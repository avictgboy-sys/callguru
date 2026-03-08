import { useState } from "react";
import { Send } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePostComments, useCreateComment } from "@/hooks/useFeed";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

const CommentsSection = ({ postId }: { postId: string }) => {
  const { user } = useAuth();
  const { data: comments, isLoading } = usePostComments(postId);
  const createComment = useCreateComment();
  const [text, setText] = useState("");

  const handleSubmit = async () => {
    if (!text.trim()) return;
    if (!user) {
      toast.error("Please log in to comment");
      return;
    }
    try {
      await createComment.mutateAsync({ postId, content: text.trim() });
      setText("");
    } catch {
      toast.error("Failed to add comment");
    }
  };

  return (
    <div className="border-t border-border bg-secondary/30">
      {/* Comment list */}
      <div className="max-h-60 overflow-y-auto px-4 py-3 space-y-3">
        {isLoading && <p className="text-xs text-muted-foreground">Loading...</p>}
        {comments?.map((c) => (
          <div key={c.id} className="flex gap-2">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-primary">
                {(c.author?.full_name || "U")[0].toUpperCase()}
              </span>
            </div>
            <div className="bg-card rounded-xl px-3 py-2 border border-border">
              <p className="text-xs font-semibold text-foreground">{c.author?.full_name || "Anonymous"}</p>
              <p className="text-xs text-foreground mt-0.5">{c.content}</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
        ))}
        {comments?.length === 0 && !isLoading && (
          <p className="text-xs text-muted-foreground text-center py-2">No comments yet</p>
        )}
      </div>

      {/* Input */}
      {user && (
        <div className="flex items-center gap-2 px-4 py-3 border-t border-border">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a comment..."
            className="flex-1 bg-card rounded-full px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground border border-border outline-none focus:border-primary"
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
          <button
            onClick={handleSubmit}
            disabled={!text.trim() || createComment.isPending}
            className="w-8 h-8 rounded-full bg-primary flex items-center justify-center disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5 text-primary-foreground" />
          </button>
        </div>
      )}
    </div>
  );
};

export default CommentsSection;

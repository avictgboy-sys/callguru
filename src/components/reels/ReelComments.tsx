import { useState } from "react";
import { X, Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useReelComments, useCreateReelComment } from "@/hooks/useReels";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";

interface ReelCommentsProps {
  reelId: string;
  onClose: () => void;
}

const ReelComments = ({ reelId, onClose }: ReelCommentsProps) => {
  const [text, setText] = useState("");
  const { data: comments, isLoading } = useReelComments(reelId);
  const createComment = useCreateReelComment();

  const handleSubmit = () => {
    if (!text.trim()) return;
    createComment.mutate({ reelId, content: text.trim() });
    setText("");
  };

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="absolute bottom-0 left-0 right-0 z-50 bg-card rounded-t-2xl max-h-[60vh] flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-bold text-foreground">Comments</h3>
        <button onClick={onClose} className="p-1">
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Comments list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <p className="text-muted-foreground text-center text-sm">Loading...</p>
        ) : !comments?.length ? (
          <p className="text-muted-foreground text-center text-sm">No comments yet. Be the first!</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={c.profile?.avatar_url || ""} />
                <AvatarFallback className="text-xs bg-muted">{(c.profile?.full_name || "U")[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold text-foreground">{c.profile?.full_name || "User"}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-foreground mt-0.5">{c.content}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border flex gap-2">
        <Input
          placeholder="Add a comment..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          className="flex-1"
        />
        <Button size="icon" onClick={handleSubmit} disabled={!text.trim() || createComment.isPending}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
};

export default ReelComments;

import { useState } from "react";
import { Image, Video, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCreatePost } from "@/hooks/useFeed";
import { toast } from "sonner";

const CreatePostCard = () => {
  const { user, profile } = useAuth();
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);
  const createPost = useCreatePost();

  if (!user) return null;

  const handleSubmit = async () => {
    if (!content.trim() && !imageUrl.trim()) return;
    try {
      await createPost.mutateAsync({
        content: content.trim(),
        image_url: imageUrl.trim() || undefined,
        post_type: imageUrl.trim() ? "image" : "text",
      });
      setContent("");
      setImageUrl("");
      setShowImageInput(false);
      toast.success("Post created!");
    } catch {
      toast.error("Failed to create post");
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-border shadow-card p-5">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <span className="text-sm font-bold text-primary">
            {(profile?.full_name || "U")[0].toUpperCase()}
          </span>
        </div>
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full bg-transparent border-none outline-none resize-none text-foreground placeholder:text-muted-foreground text-sm min-h-[60px]"
            rows={2}
          />
          {showImageInput && (
            <div className="flex items-center gap-2 mt-2">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Paste image URL..."
                className="flex-1 bg-secondary rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary"
              />
              <button onClick={() => { setShowImageInput(false); setImageUrl(""); }}>
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-primary"
            onClick={() => setShowImageInput(!showImageInput)}
          >
            <Image className="w-4 h-4 mr-1" /> Photo
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground" disabled>
            <Video className="w-4 h-4 mr-1" /> Video
          </Button>
        </div>
        <Button
          variant="hero"
          size="sm"
          onClick={handleSubmit}
          disabled={createPost.isPending || (!content.trim() && !imageUrl.trim())}
        >
          <Send className="w-4 h-4 mr-1" />
          {createPost.isPending ? "Posting..." : "Post"}
        </Button>
      </div>
    </div>
  );
};

export default CreatePostCard;

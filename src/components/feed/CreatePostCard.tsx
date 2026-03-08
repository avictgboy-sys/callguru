import { useState } from "react";
import { Image, Video, Smile, Send, X, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCreatePost } from "@/hooks/useFeed";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

const CreatePostCard = () => {
  const { user, profile } = useAuth();
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);
  const createPost = useCreatePost();

  if (!user) return null;

  const initials = (profile?.full_name || "U")[0].toUpperCase();

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
    <div className="bg-card rounded-xl border border-border shadow-sm">
      <div className="flex gap-3 p-4 pb-3">
        <Avatar className="w-10 h-10">
          <AvatarImage src={profile?.avatar_url || ""} />
          <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <button
          onClick={() => {
            const el = document.getElementById("create-post-textarea");
            el?.focus();
          }}
          className="flex-1 bg-secondary hover:bg-secondary/80 rounded-full px-4 py-2.5 text-left text-sm text-muted-foreground transition-colors"
        >
          What's on your mind, {profile?.full_name?.split(" ")[0] || "there"}?
        </button>
      </div>

      {/* Expanded input */}
      <div className="px-4 pb-2">
        <textarea
          id="create-post-textarea"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`What's on your mind, ${profile?.full_name?.split(" ")[0] || "there"}?`}
          className="w-full bg-transparent border-none outline-none resize-none text-foreground placeholder:text-muted-foreground text-[15px] min-h-[0px] focus:min-h-[80px] transition-all"
          rows={1}
          onFocus={(e) => (e.target.style.minHeight = "80px")}
          onBlur={(e) => {
            if (!content.trim()) e.target.style.minHeight = "0px";
          }}
        />
        {showImageInput && (
          <div className="flex items-center gap-2 mt-2 mb-2">
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

      <div className="flex items-center justify-between px-4 py-2 border-t border-border">
        <div className="flex gap-0.5">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg text-xs gap-1.5"
            disabled
          >
            <Video className="w-5 h-5 text-red-500" /> Live Video
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-green-600 hover:bg-green-50 rounded-lg text-xs gap-1.5"
            onClick={() => setShowImageInput(!showImageInput)}
          >
            <Image className="w-5 h-5 text-green-500" /> Photo
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-yellow-600 hover:bg-yellow-50 rounded-lg text-xs gap-1.5 hidden sm:flex"
          >
            <Smile className="w-5 h-5 text-yellow-500" /> Feeling
          </Button>
        </div>
        {(content.trim() || imageUrl.trim()) && (
          <Button
            size="sm"
            className="rounded-full bg-primary text-primary-foreground font-semibold px-5"
            onClick={handleSubmit}
            disabled={createPost.isPending}
          >
            {createPost.isPending ? "Posting..." : "Post"}
          </Button>
        )}
      </div>
    </div>
  );
};

export default CreatePostCard;

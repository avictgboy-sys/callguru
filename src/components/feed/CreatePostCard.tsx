import { useState, useRef } from "react";
import { Image, Video, Smile, Send, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCreatePost } from "@/hooks/useFeed";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const CreatePostCard = () => {
  const { user, profile } = useAuth();
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const createPost = useCreatePost();

  if (!user) return null;

  const initials = (profile?.full_name || "U")[0].toUpperCase();

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10MB");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    // Clear video if image selected
    setVideoFile(null);
    setVideoPreview(null);
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      toast.error("Please select a video file");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error("ভিডিও ফাইল ৫০MB এর কম হতে হবে");
      return;
    }
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
    // Clear image if video selected
    setImageFile(null);
    setImagePreview(null);
  };

  const clearMedia = () => {
    setImageFile(null);
    setVideoFile(null);
    setImagePreview(null);
    setVideoPreview(null);
  };

  const uploadFile = async (file: File, folder: string): Promise<string> => {
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${folder}/${Date.now()}.${ext}`;
    console.log("Uploading file:", file.name, "size:", file.size, "type:", file.type, "path:", path);
    const { error } = await supabase.storage.from("post-media").upload(path, file, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });
    if (error) {
      console.error("Upload error:", error);
      throw error;
    }
    const { data } = supabase.storage.from("post-media").getPublicUrl(path);
    console.log("Upload success, URL:", data.publicUrl);
    return data.publicUrl;
  };

  const handleSubmit = async () => {
    if (!content.trim() && !imageFile && !videoFile) return;
    try {
      setUploading(true);
      let image_url: string | undefined;
      let video_url: string | undefined;
      let post_type = "text";

      if (imageFile) {
        image_url = await uploadFile(imageFile, "images");
        post_type = "image";
      }
      if (videoFile) {
        video_url = await uploadFile(videoFile, "videos");
        post_type = "video";
      }

      await createPost.mutateAsync({
        content: content.trim(),
        image_url,
        video_url,
        post_type,
      });
      setContent("");
      clearMedia();
      toast.success("Post created!");
    } catch (err: any) {
      console.error("Post creation error:", err);
      toast.error(err?.message || "পোস্ট তৈরি করতে ব্যর্থ হয়েছে");
    } finally {
      setUploading(false);
    }
  };

  const isPosting = createPost.isPending || uploading;

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      {/* Hidden file inputs */}
      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
      <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoSelect} />

      <div className="flex gap-3 p-4 pb-3">
        <Avatar className="w-10 h-10">
          <AvatarImage src={profile?.avatar_url || ""} />
          <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <button
          onClick={() => document.getElementById("create-post-textarea")?.focus()}
          className="flex-1 bg-secondary hover:bg-secondary/80 rounded-full px-4 py-2.5 text-left text-sm text-muted-foreground transition-colors"
        >
          What's on your mind, {profile?.full_name?.split(" ")[0] || "there"}?
        </button>
      </div>

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
            if (!content.trim() && !imageFile && !videoFile) e.target.style.minHeight = "0px";
          }}
        />

        {/* Image preview */}
        {imagePreview && (
          <div className="relative mt-2 mb-2">
            <img src={imagePreview} alt="Preview" className="w-full max-h-[300px] object-cover rounded-lg" />
            <button
              onClick={clearMedia}
              className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Video preview */}
        {videoPreview && (
          <div className="relative mt-2 mb-2">
            <video src={videoPreview} controls className="w-full max-h-[300px] rounded-lg" />
            <button
              onClick={clearMedia}
              className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2 border-t border-border">
        <div className="flex gap-0.5 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg text-xs gap-1 px-2 sm:px-3 sm:gap-1.5"
            onClick={() => videoInputRef.current?.click()}
            disabled={isPosting}
          >
            <Video className="w-5 h-5 text-red-500" /> <span className="hidden xs:inline sm:inline">Video</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-green-600 hover:bg-green-50 rounded-lg text-xs gap-1 px-2 sm:px-3 sm:gap-1.5"
            onClick={() => imageInputRef.current?.click()}
            disabled={isPosting}
          >
            <Image className="w-5 h-5 text-green-500" /> <span className="hidden xs:inline sm:inline">Photo</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-yellow-600 hover:bg-yellow-50 rounded-lg text-xs gap-1.5 hidden sm:flex"
          >
            <Smile className="w-5 h-5 text-yellow-500" /> Feeling
          </Button>
        </div>
        <Button
          size="sm"
          className="rounded-full bg-primary text-primary-foreground font-semibold px-4 sm:px-5 shrink-0"
          onClick={handleSubmit}
          disabled={isPosting || (!content.trim() && !imageFile && !videoFile)}
        >
          {isPosting ? (
            <><Loader2 className="w-4 h-4 animate-spin mr-1" /> <span className="hidden sm:inline">Uploading...</span><span className="sm:hidden">...</span></>
          ) : "Post"}
        </Button>
      </div>
    </div>
  );
};

export default CreatePostCard;

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { useCreateReel } from "@/hooks/useReels";

const CreateReelDialog = () => {
  const [open, setOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [caption, setCaption] = useState("");
  const createReel = useCreateReel();

  const handleSubmit = () => {
    if (!videoUrl.trim()) return;
    createReel.mutate(
      { video_url: videoUrl.trim(), caption: caption.trim() || undefined },
      { onSuccess: () => { setOpen(false); setVideoUrl(""); setCaption(""); } }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" className="text-white bg-white/20 backdrop-blur-sm rounded-full">
          <Plus className="w-6 h-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Reel</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Video URL</Label>
            <Input
              placeholder="https://example.com/video.mp4"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Caption (optional)</Label>
            <Textarea
              placeholder="Write a caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
            />
          </div>
          <Button onClick={handleSubmit} disabled={!videoUrl.trim() || createReel.isPending} className="w-full">
            {createReel.isPending ? "Posting..." : "Post Reel"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateReelDialog;

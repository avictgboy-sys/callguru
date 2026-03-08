import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Upload, Film, X } from "lucide-react";
import { useCreateReel } from "@/hooks/useReels";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const CreateReelDialog = () => {
  const [open, setOpen] = useState(false);
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const createReel = useCreateReel();
  const { user } = useAuth();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (!selected.type.startsWith("video/")) {
      toast.error("শুধুমাত্র ভিডিও ফাইল আপলোড করুন");
      return;
    }
    if (selected.size > MAX_FILE_SIZE) {
      toast.error("ফাইল সাইজ ৫০MB এর বেশি হতে পারবে না");
      return;
    }
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const clearFile = () => {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!file || !user) return;
    setUploading(true);
    setProgress(10);

    try {
      const ext = file.name.split(".").pop() || "mp4";
      const path = `${user.id}/${Date.now()}.${ext}`;

      setProgress(30);
      const { error: uploadError } = await supabase.storage
        .from("reel-videos")
        .upload(path, file, { contentType: file.type, upsert: false });

      if (uploadError) throw uploadError;
      setProgress(70);

      const { data: urlData } = supabase.storage
        .from("reel-videos")
        .getPublicUrl(path);

      setProgress(90);
      await createReel.mutateAsync({
        video_url: urlData.publicUrl,
        caption: caption.trim() || undefined,
      });

      setProgress(100);
      setOpen(false);
      setCaption("");
      clearFile();
    } catch (err: any) {
      toast.error(err.message || "আপলোড ব্যর্থ হয়েছে");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) clearFile(); }}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" className="text-white bg-white/20 backdrop-blur-sm rounded-full">
          <Plus className="w-6 h-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>রিল তৈরি করুন</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* File upload area */}
          <div className="space-y-2">
            <Label>ভিডিও</Label>
            {!file ? (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full h-40 border-2 border-dashed border-muted-foreground/30 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-colors bg-muted/30"
              >
                <Upload className="w-8 h-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">ভিডিও সিলেক্ট করুন</span>
                <span className="text-xs text-muted-foreground/60">সর্বোচ্চ ৫০MB • MP4, WebM, MOV</span>
              </button>
            ) : (
              <div className="relative rounded-lg overflow-hidden bg-black">
                <video src={preview!} className="w-full h-40 object-contain" controls />
                <button
                  onClick={clearFile}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          {/* Caption */}
          <div className="space-y-2">
            <Label>ক্যাপশন (ঐচ্ছিক)</Label>
            <Textarea
              placeholder="ক্যাপশন লিখুন..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
            />
          </div>

          {/* Upload progress */}
          {uploading && (
            <div className="space-y-1">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">আপলোড হচ্ছে... {progress}%</p>
            </div>
          )}

          <Button onClick={handleSubmit} disabled={!file || uploading} className="w-full">
            {uploading ? (
              <span className="flex items-center gap-2"><Film className="w-4 h-4 animate-pulse" /> আপলোড হচ্ছে...</span>
            ) : (
              "রিল পোস্ট করুন"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateReelDialog;

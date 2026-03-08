import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Megaphone, ImagePlus, Video, Upload } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const EditAd = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [ad, setAd] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id || !user) return;
    (async () => {
      const { data, error } = await supabase
        .from("self_ads")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();
      if (error || !data) {
        toast.error("Ad not found");
        navigate("/my-ads");
        return;
      }
      setAd(data);
      setTitle(data.title);
      setDescription(data.description || "");
      setLinkUrl(data.link_url || "");
      setImagePreview(data.image_url || null);
      setLoading(false);
    })();
  }, [id, user]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("ইমেজ ৫MB-এর বেশি হতে পারবে না");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      toast.error("ভিডিও ৫০MB-এর বেশি হতে পারবে না");
      return;
    }
    setVideoFile(file);
  };

  const handleSubmit = async () => {
    if (!user || !ad) return;
    if (ad.status !== "pending") {
      toast.error("শুধুমাত্র pending ad এডিট করা যায়");
      return;
    }
    if (!title.trim()) {
      toast.error("Title দিন");
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl = ad.image_url;
      let videoUrl = ad.video_url;

      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from("ad-media").upload(path, imageFile);
        if (error) throw error;
        const { data: urlData } = supabase.storage.from("ad-media").getPublicUrl(path);
        imageUrl = urlData.publicUrl;
      }

      if (videoFile) {
        const ext = videoFile.name.split(".").pop();
        const path = `${user.id}/${Date.now()}-video.${ext}`;
        const { error } = await supabase.storage.from("ad-media").upload(path, videoFile);
        if (error) throw error;
        const { data: urlData } = supabase.storage.from("ad-media").getPublicUrl(path);
        videoUrl = urlData.publicUrl;
      }

      const { error: updateError } = await supabase
        .from("self_ads")
        .update({
          title: title.trim(),
          description: description.trim() || null,
          link_url: linkUrl.trim() || null,
          image_url: imageUrl,
          video_url: videoUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", ad.id)
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      toast.success("Ad আপডেট হয়েছে!");
      navigate("/my-ads");
    } catch (e: any) {
      toast.error(e.message || "Failed to update ad");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const canEdit = ad?.status === "pending";

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto flex items-center h-16 px-4 gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/my-ads"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <Megaphone className="w-5 h-5 text-primary" />
          <h1 className="font-heading text-xl font-bold text-foreground">Edit Ad</h1>
          <Badge variant={ad?.status === "pending" ? "secondary" : "default"} className="ml-auto capitalize">
            {ad?.status}
          </Badge>
        </div>
      </nav>

      <div className="container mx-auto max-w-2xl px-4 py-8 space-y-6">
        {!canEdit && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-4 text-sm text-destructive">
              শুধুমাত্র "Pending" স্ট্যাটাসের ad এডিট করা যায়। এই ad ইতোমধ্যে {ad?.status} হয়ে গেছে।
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ad Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="আপনার Ad-এর শিরোনাম"
                maxLength={100}
                disabled={!canEdit}
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="বিস্তারিত বিবরণ..."
                maxLength={500}
                rows={3}
                disabled={!canEdit}
              />
            </div>

            <div className="space-y-2">
              <Label>Link URL (optional)</Label>
              <Input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                type="url"
                disabled={!canEdit}
              />
            </div>

            {canEdit && (
              <>
                <div className="space-y-2">
                  <Label>Image</Label>
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-6 cursor-pointer hover:border-primary/50 transition-colors">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="max-h-48 rounded-lg object-cover" />
                    ) : (
                      <>
                        <ImagePlus className="w-8 h-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">ইমেজ আপলোড করুন (max 5MB)</p>
                      </>
                    )}
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                </div>

                {(ad?.ad_type === "video" || ad?.ad_type === "sponsored") && (
                  <div className="space-y-2">
                    <Label>Video (optional)</Label>
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-6 cursor-pointer hover:border-primary/50 transition-colors">
                      {videoFile ? (
                        <div className="flex items-center gap-2">
                          <Video className="w-5 h-5 text-primary" />
                          <span className="text-sm text-foreground">{videoFile.name}</span>
                        </div>
                      ) : ad?.video_url ? (
                        <div className="flex items-center gap-2">
                          <Video className="w-5 h-5 text-primary" />
                          <span className="text-sm text-muted-foreground">Current video uploaded. Click to replace.</span>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">ভিডিও আপলোড করুন (max 50MB)</p>
                        </>
                      )}
                      <input type="file" accept="video/*" onChange={handleVideoChange} className="hidden" />
                    </label>
                  </div>
                )}
              </>
            )}

            {!canEdit && ad?.image_url && (
              <img src={ad.image_url} alt="Ad" className="w-full rounded-lg max-h-48 object-cover" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Ad Type</span>
              <Badge variant="outline" className="capitalize">{ad?.ad_type}</Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Budget</span>
              <span className="font-medium text-foreground">৳{ad?.budget}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Impressions</span>
              <span className="font-medium text-foreground">{ad?.impressions}</span>
            </div>
          </CardContent>
        </Card>

        {canEdit && (
          <Button onClick={handleSubmit} disabled={submitting} className="w-full" size="lg">
            {submitting ? "Updating..." : "Update Ad"}
          </Button>
        )}

        {ad?.admin_note && (
          <Card className="border-primary/20">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Admin Note:</p>
              <p className="text-sm text-foreground mt-1">{ad.admin_note}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default EditAd;

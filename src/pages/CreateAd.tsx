import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useSetting } from "@/hooks/useAppSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ImagePlus, Video, Megaphone, Upload, Wallet } from "lucide-react";
import { toast } from "sonner";

const AD_TYPES = [
  { value: "banner", label: "Banner Ad", desc: "ফিডে ব্যানার হিসেবে দেখাবে" },
  { value: "sponsored", label: "Sponsored Post", desc: "ফিডে পোস্টের মতো দেখাবে, 'Sponsored' ট্যাগ সহ" },
  { value: "video", label: "Video Ad", desc: "ভিডিও কন্টেন্ট দেখার আগে interstitial হিসেবে দেখাবে" },
];

const CreateAd = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const costPer1000 = parseFloat(useSetting("ad_cost_per_1000") || "50");

  const [adType, setAdType] = useState("banner");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [budget, setBudget] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const estimatedImpressions = budget ? Math.floor((parseFloat(budget) / costPer1000) * 1000) : 0;
  const walletBalance = profile?.wallet_balance || 0;

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
    if (!user) return;
    if (!title.trim()) { toast.error("Title দিন"); return; }
    const budgetNum = parseFloat(budget);
    if (!budgetNum || budgetNum < costPer1000) {
      toast.error(`ন্যূনতম বাজেট ৳${costPer1000}`);
      return;
    }
    if (budgetNum > walletBalance) {
      toast.error("Insufficient wallet balance");
      return;
    }
    if (adType !== "sponsored" && !imageFile && !videoFile) {
      toast.error("ইমেজ বা ভিডিও আপলোড করুন");
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl: string | null = null;
      let videoUrl: string | null = null;

      // Upload image
      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from("ad-media").upload(path, imageFile);
        if (error) throw error;
        const { data: urlData } = supabase.storage.from("ad-media").getPublicUrl(path);
        imageUrl = urlData.publicUrl;
      }

      // Upload video
      if (videoFile) {
        const ext = videoFile.name.split(".").pop();
        const path = `${user.id}/${Date.now()}-video.${ext}`;
        const { error } = await supabase.storage.from("ad-media").upload(path, videoFile);
        if (error) throw error;
        const { data: urlData } = supabase.storage.from("ad-media").getPublicUrl(path);
        videoUrl = urlData.publicUrl;
      }

      // Atomic wallet deduction + transaction log (prevents double-spending)
      const { error: spendError } = await supabase.rpc("spend_wallet_for_ad", {
        p_amount: budgetNum,
        p_description: `Ad campaign: ${title}`,
      });
      if (spendError) throw spendError;


      // Create ad
      const { error: adError } = await supabase.from("self_ads" as any).insert({
        user_id: user.id,
        ad_type: adType,
        title: title.trim(),
        description: description.trim() || null,
        image_url: imageUrl,
        video_url: videoUrl,
        link_url: linkUrl.trim() || null,
        budget: budgetNum,
      } as any);

      if (adError) throw adError;

      toast.success("Ad submitted! Admin approval-এর পর দেখানো হবে।");
      navigate("/dashboard");
    } catch (e: any) {
      toast.error(e.message || "Failed to create ad");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto flex items-center h-16 px-4 gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <Megaphone className="w-5 h-5 text-primary" />
          <h1 className="font-heading text-xl font-bold text-foreground">Create Ad</h1>
        </div>
      </nav>

      <div className="container mx-auto max-w-2xl px-4 py-8 space-y-6">
        {/* Wallet info */}
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Wallet className="w-6 h-6 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Wallet Balance</p>
              <p className="font-heading text-xl font-bold text-foreground">৳{walletBalance.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Ad Type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ad Type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {AD_TYPES.map((t) => (
              <label
                key={t.value}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  adType === t.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <input
                  type="radio"
                  name="adType"
                  value={t.value}
                  checked={adType === t.value}
                  onChange={() => setAdType(t.value)}
                  className="accent-primary"
                />
                <div>
                  <p className="font-medium text-sm text-foreground">{t.label}</p>
                  <p className="text-xs text-muted-foreground">{t.desc}</p>
                </div>
              </label>
            ))}
          </CardContent>
        </Card>

        {/* Ad Content */}
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
              />
            </div>

            <div className="space-y-2">
              <Label>Link URL (optional)</Label>
              <Input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                type="url"
              />
            </div>

            {/* Image upload */}
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

            {/* Video upload for video ads */}
            {(adType === "video" || adType === "sponsored") && (
              <div className="space-y-2">
                <Label>Video (optional)</Label>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-6 cursor-pointer hover:border-primary/50 transition-colors">
                  {videoFile ? (
                    <div className="flex items-center gap-2">
                      <Video className="w-5 h-5 text-primary" />
                      <span className="text-sm text-foreground">{videoFile.name}</span>
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
          </CardContent>
        </Card>

        {/* Budget */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Budget</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Budget (৳) *</Label>
              <Input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder={`ন্যূনতম ৳${costPer1000}`}
                min={costPer1000}
              />
            </div>
            <div className="bg-muted/50 rounded-xl p-4 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cost per 1000 views</span>
                <span className="font-medium text-foreground">৳{costPer1000}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Estimated impressions</span>
                <span className="font-medium text-primary">{estimatedImpressions.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full"
          size="lg"
        >
          {submitting ? "Submitting..." : "Submit Ad for Review"}
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          Ad টি Admin approve করার পর ফিডে দেখানো শুরু হবে। Wallet থেকে ৳{budget || "0"} কাটা হবে।
        </p>
      </div>
    </div>
  );
};

export default CreateAd;

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useHomeServiceCategories, useCreateHomeService } from "@/hooks/useHomeServices";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const CreateHomeService = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: categories } = useHomeServiceCategories();
  const createService = useCreateHomeService();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [pricingType, setPricingType] = useState("fixed");
  const [fixedPrice, setFixedPrice] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [area, setArea] = useState("");

  const handleSubmit = async () => {
    if (!user) return;
    if (!title || !categoryId) {
      toast.error("টাইটেল এবং ক্যাটেগরি দিন");
      return;
    }
    if (pricingType === "fixed" && !fixedPrice) {
      toast.error("মূল্য দিন");
      return;
    }

    await createService.mutateAsync({
      provider_id: user.id,
      title,
      description: description || undefined,
      category_id: categoryId,
      pricing_type: pricingType,
      fixed_price: pricingType === "fixed" ? Number(fixedPrice) : undefined,
      min_price: pricingType === "quote" ? Number(minPrice) || undefined : undefined,
      max_price: pricingType === "quote" ? Number(maxPrice) || undefined : undefined,
      area: area || undefined,
    });
    navigate("/home-services");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-30 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-heading font-bold text-lg text-foreground">হোম সার্ভিস তৈরি করুন</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground">সার্ভিস টাইটেল *</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="যেমন: AC সার্ভিসিং ও মেরামত" className="mt-1" />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">বিস্তারিত</label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="আপনার সার্ভিস সম্পর্কে বিস্তারিত লিখুন..." className="mt-1" rows={3} />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">ক্যাটেগরি *</label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="ক্যাটেগরি নির্বাচন করুন" /></SelectTrigger>
            <SelectContent>
              {(categories || []).map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>{cat.icon} {cat.name_bn}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">মূল্য টাইপ</label>
          <Select value={pricingType} onValueChange={setPricingType}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="fixed">নির্দিষ্ট মূল্য</SelectItem>
              <SelectItem value="quote">কোটেশন ভিত্তিক</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {pricingType === "fixed" ? (
          <div>
            <label className="text-sm font-medium text-foreground">মূল্য (৳) *</label>
            <Input type="number" value={fixedPrice} onChange={(e) => setFixedPrice(e.target.value)} placeholder="500" className="mt-1" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-foreground">সর্বনিম্ন (৳)</label>
              <Input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="300" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">সর্বোচ্চ (৳)</label>
              <Input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="2000" className="mt-1" />
            </div>
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-foreground">সার্ভিস এরিয়া</label>
          <Input value={area} onChange={(e) => setArea(e.target.value)} placeholder="যেমন: ঢাকা, চট্টগ্রাম" className="mt-1" />
        </div>

        <Button variant="hero" className="w-full" onClick={handleSubmit} disabled={createService.isPending}>
          {createService.isPending ? "তৈরি হচ্ছে..." : "সার্ভিস তৈরি করুন"}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          প্ল্যাটফর্ম ফি: ১.৫% • কাজ সম্পন্নের পর ৩ দিন পেমেন্ট হোল্ড থাকবে
        </p>
      </div>
    </div>
  );
};

export default CreateHomeService;

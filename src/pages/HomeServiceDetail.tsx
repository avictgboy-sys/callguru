import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateHomeBooking } from "@/hooks/useHomeServices";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, BadgeCheck, Star, Briefcase, MapPin, Shield, Clock3 } from "lucide-react";
import type { HomeService } from "@/hooks/useHomeServices";
import { toast } from "sonner";

const HomeServiceDetail = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const createBooking = useCreateHomeBooking();
  const [open, setOpen] = useState(false);
  const [problem, setProblem] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [prefDate, setPrefDate] = useState("");
  const [prefTime, setPrefTime] = useState("");

  const { data: service, isLoading } = useQuery({
    queryKey: ["home-service", serviceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("home_services")
        .select("*, home_service_categories(name, name_bn, icon)")
        .eq("id", serviceId!)
        .single();
      if (error) throw error;
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, is_verified")
        .eq("user_id", data.provider_id)
        .single();
      return { ...data, profiles: profile } as HomeService;
    },
    enabled: !!serviceId,
  });

  const handleBook = async () => {
    if (!user || !service) return;
    if (!address || !phone) {
      toast.error("ঠিকানা ও ফোন নম্বর দিন");
      return;
    }
    await createBooking.mutateAsync({
      service_id: service.id,
      customer_id: user.id,
      provider_id: service.provider_id,
      pricing_type: service.pricing_type,
      quoted_price: service.pricing_type === "fixed" ? service.fixed_price || undefined : undefined,
      problem_description: problem || undefined,
      address,
      phone,
      preferred_date: prefDate || undefined,
      preferred_time: prefTime || undefined,
    });
    setOpen(false);
    navigate("/my-bookings");
  };

  if (isLoading || !service) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">লোড হচ্ছে...</div>;

  const name = service.profiles?.full_name || "Expert";
  const isOwn = user?.id === service.provider_id;

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-30 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-heading font-bold text-lg text-foreground truncate">{service.title}</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-5">
        {/* Provider info */}
        <div className="flex items-center gap-3">
          <Avatar className="w-14 h-14 border-2 border-primary/20">
            <AvatarImage src={service.profiles?.avatar_url || ""} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">{name[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-foreground">{name}</span>
              {service.profiles?.is_verified && <BadgeCheck className="w-4 h-4 text-primary" />}
            </div>
            <span className="text-sm text-muted-foreground">
              {service.home_service_categories?.icon} {service.home_service_categories?.name_bn}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4">
          <div className="flex items-center gap-1 text-sm">
            <Star className="w-4 h-4" style={{ color: "hsl(var(--star))", fill: "hsl(var(--star))" }} />
            <span className="font-medium">{(service.rating ?? 0).toFixed(1)}</span>
            <span className="text-muted-foreground">({service.total_reviews})</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Briefcase className="w-4 h-4" /> {service.total_jobs} jobs
          </div>
          {service.area && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" /> {service.area}
            </div>
          )}
        </div>

        {/* Description */}
        {service.description && (
          <div className="bg-secondary/30 rounded-lg p-4">
            <p className="text-sm text-foreground whitespace-pre-wrap">{service.description}</p>
          </div>
        )}

        {/* Pricing */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="font-medium text-foreground mb-2">মূল্য</h3>
          {service.pricing_type === "fixed" ? (
            <div className="text-2xl font-heading font-bold text-primary">৳{service.fixed_price}</div>
          ) : (
            <div>
              <span className="text-lg font-heading font-bold text-primary">৳{service.min_price} – ৳{service.max_price}</span>
              <p className="text-xs text-muted-foreground mt-1">সমস্যার উপর ভিত্তি করে দাম নির্ধারণ হবে</p>
            </div>
          )}
        </div>

        {/* Payment info */}
        <div className="bg-secondary/30 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-foreground">৫০% অ্যাডভান্স পেমেন্ট, বাকি ৫০% কাজ শেষে</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock3 className="w-4 h-4 text-primary" />
            <span className="text-foreground">কাজ শেষের পর ৩ দিন পেমেন্ট হোল্ড (নিরাপত্তা)</span>
          </div>
          <p className="text-xs text-muted-foreground">প্ল্যাটফর্ম ফি: ১.৫%</p>
        </div>

        {/* Book button */}
        {!isOwn && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="hero" className="w-full" size="lg" disabled={!service.is_available}>
                {service.is_available ? "বুক করুন" : "Offline"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>বুকিং তথ্য দিন</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">সমস্যার বিবরণ</label>
                  <Textarea value={problem} onChange={(e) => setProblem(e.target.value)} placeholder="আপনার সমস্যা বিস্তারিত লিখুন..." className="mt-1" rows={3} />
                </div>
                <div>
                  <label className="text-sm font-medium">ঠিকানা *</label>
                  <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="বাসার পূর্ণ ঠিকানা" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">ফোন নম্বর *</label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXXXXXXXX" className="mt-1" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">পছন্দের তারিখ</label>
                    <Input type="date" value={prefDate} onChange={(e) => setPrefDate(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">সময়</label>
                    <Input value={prefTime} onChange={(e) => setPrefTime(e.target.value)} placeholder="সকাল ১০টা" className="mt-1" />
                  </div>
                </div>
                <Button variant="hero" className="w-full" onClick={handleBook} disabled={createBooking.isPending}>
                  {createBooking.isPending ? "বুক হচ্ছে..." : "বুক করুন"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default HomeServiceDetail;

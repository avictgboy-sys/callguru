import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { useCategories } from "@/hooks/useServices";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Video, ArrowLeft, DollarSign, Clock, Tag, Info,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

const serviceSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(100),
  description: z.string().trim().max(500, "Description must be under 500 characters").optional(),
  category_id: z.string().min(1, "Please select a category"),
  price_per_minute: z.coerce.number().min(0.01, "Price must be greater than 0").max(999, "Price too high"),
  tags: z.string().optional(),
});

type ServiceForm = z.infer<typeof serviceSchema>;

interface DaySchedule {
  enabled: boolean;
  start: string;
  end: string;
}

const defaultSchedule: Record<string, DaySchedule> = Object.fromEntries(
  DAYS.map((d) => [d, { enabled: d !== "Saturday" && d !== "Sunday", start: "09:00", end: "17:00" }])
);

const CreateService = () => {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { data: categories = [] } = useCategories();
  const [schedule, setSchedule] = useState<Record<string, DaySchedule>>(defaultSchedule);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ServiceForm>({
    resolver: zodResolver(serviceSchema),
    defaultValues: { title: "", description: "", category_id: "", price_per_minute: 1, tags: "" },
  });

  const updateDay = (day: string, field: keyof DaySchedule, value: string | boolean) => {
    setSchedule((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  };

  const onSubmit = async (data: ServiceForm) => {
    if (!user) return;
    setSubmitting(true);

    // Add provider role if not already
    await supabase.from("user_roles").upsert(
      { user_id: user.id, role: "provider" as const },
      { onConflict: "user_id,role" }
    );

    const tagsArray = data.tags
      ? data.tags.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    const { error } = await supabase.from("services").insert([{
      provider_id: user.id,
      title: data.title,
      description: data.description || null,
      category_id: data.category_id,
      price_per_minute: data.price_per_minute,
      tags: tagsArray,
      availability_schedule: schedule as any,
      is_available: true,
      is_active: true,
    }]);

    setSubmitting(false);

    if (error) {
      toast.error("Failed to create service: " + error.message);
    } else {
      await refreshProfile();
      toast.success("Service created! You're now a provider.");
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Video className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-xl text-foreground">CallGuru</span>
          </Link>
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-foreground">Create Your Service</h1>
          <p className="text-muted-foreground mt-1">
            Set up your expert profile and start earning through video consultations.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Info */}
          <section className="bg-card rounded-xl border border-border p-6 space-y-5">
            <h2 className="font-heading text-lg font-semibold text-foreground flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" /> Service Details
            </h2>

            <div className="space-y-2">
              <Label htmlFor="title">Service Title *</Label>
              <Input
                id="title"
                placeholder="e.g. React & TypeScript Tutoring"
                {...register("title")}
              />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your expertise and what clients can expect..."
                rows={4}
                {...register("description")}
              />
              {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Category *</Label>
              <Select onValueChange={(val) => setValue("category_id", val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category_id && <p className="text-sm text-destructive">{errors.category_id.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">
                <Tag className="w-4 h-4 inline mr-1" /> Tags (comma-separated)
              </Label>
              <Input
                id="tags"
                placeholder="e.g. React, JavaScript, Mentoring"
                {...register("tags")}
              />
            </div>
          </section>

          {/* Pricing */}
          <section className="bg-card rounded-xl border border-border p-6 space-y-5">
            <h2 className="font-heading text-lg font-semibold text-foreground flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" /> Pricing
            </h2>

            <div className="space-y-2">
              <Label htmlFor="price">Price Per Minute (USD) *</Label>
              <div className="relative max-w-xs">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="pl-10"
                  {...register("price_per_minute")}
                />
              </div>
              {errors.price_per_minute && <p className="text-sm text-destructive">{errors.price_per_minute.message}</p>}
              <p className="text-xs text-muted-foreground">
                A 30-min call at ${watch("price_per_minute") || 0}/min = ${((watch("price_per_minute") || 0) * 30).toFixed(2)}
              </p>
            </div>
          </section>

          {/* Availability */}
          <section className="bg-card rounded-xl border border-border p-6 space-y-5">
            <h2 className="font-heading text-lg font-semibold text-foreground flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" /> Availability Schedule
            </h2>
            <p className="text-sm text-muted-foreground">Set when you're available for consultations.</p>

            <div className="space-y-3">
              {DAYS.map((day) => (
                <div key={day} className="flex items-center gap-4 py-2 border-b border-border last:border-0">
                  <div className="w-28 flex items-center gap-2">
                    <Switch
                      checked={schedule[day].enabled}
                      onCheckedChange={(checked) => updateDay(day, "enabled", checked)}
                    />
                    <span className={`text-sm font-medium ${schedule[day].enabled ? "text-foreground" : "text-muted-foreground"}`}>
                      {day.slice(0, 3)}
                    </span>
                  </div>
                  {schedule[day].enabled ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        className="w-32"
                        value={schedule[day].start}
                        onChange={(e) => updateDay(day, "start", e.target.value)}
                      />
                      <span className="text-muted-foreground text-sm">to</span>
                      <Input
                        type="time"
                        className="w-32"
                        value={schedule[day].end}
                        onChange={(e) => updateDay(day, "end", e.target.value)}
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Unavailable</span>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Submit */}
          <Button type="submit" variant="hero" size="lg" className="w-full" disabled={submitting}>
            {submitting ? "Creating..." : "Create Service & Become a Provider"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default CreateService;

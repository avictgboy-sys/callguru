import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { useCategories } from "@/hooks/useServices";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Video, ArrowLeft, Tag, Info, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const serviceSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(100),
  description: z.string().trim().max(500, "Description must be under 500 characters").optional(),
  category_id: z.string().min(1, "Please select a category"),
  price_per_minute: z.coerce.number().min(0.01, "Price must be greater than 0").max(999, "Price too high"),
  tags: z.string().optional(),
});

type ServiceForm = z.infer<typeof serviceSchema>;

const EditService = () => {
  const { serviceId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: categories = [] } = useCategories();
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);

  const { data: service, isLoading } = useQuery({
    queryKey: ["service-edit", serviceId],
    enabled: !!serviceId && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("id", serviceId!)
        .eq("provider_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ServiceForm>({
    resolver: zodResolver(serviceSchema),
    defaultValues: { title: "", description: "", category_id: "", price_per_minute: 1, tags: "" },
  });

  useEffect(() => {
    if (service) {
      reset({
        title: service.title,
        description: service.description || "",
        category_id: service.category_id,
        price_per_minute: service.price_per_minute,
        tags: service.tags?.join(", ") || "",
      });
      setIsAvailable(service.is_available ?? true);
    }
  }, [service, reset]);

  const onSubmit = async (data: ServiceForm) => {
    if (!user || !serviceId) return;
    setSubmitting(true);

    const tagsArray = data.tags
      ? data.tags.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    const { error } = await supabase.from("services").update({
      title: data.title,
      description: data.description || null,
      category_id: data.category_id,
      price_per_minute: data.price_per_minute,
      tags: tagsArray,
      is_available: isAvailable,
    }).eq("id", serviceId).eq("provider_id", user.id);

    setSubmitting(false);

    if (error) {
      toast.error("Failed to update service: " + error.message);
    } else {
      qc.invalidateQueries({ queryKey: ["my-services"] });
      qc.invalidateQueries({ queryKey: ["services"] });
      toast.success("Service updated!");
      navigate("/dashboard");
    }
  };

  const handleDelete = async () => {
    if (!serviceId || !user) return;
    setDeleting(true);
    const { error } = await supabase
      .from("services")
      .update({ is_active: false })
      .eq("id", serviceId)
      .eq("provider_id", user.id);
    setDeleting(false);
    if (error) {
      toast.error("Failed to delete service");
    } else {
      qc.invalidateQueries({ queryKey: ["my-services"] });
      qc.invalidateQueries({ queryKey: ["services"] });
      toast.success("Service deleted");
      navigate("/dashboard");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Service not found</p>
        <Button variant="outline" onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card">
        <div className="flex items-center justify-between h-14 px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Video className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-lg text-foreground hidden sm:inline">CallGuru</span>
          </Link>
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        </div>
      </nav>

      <div className="px-4 py-6 max-w-2xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">Edit Service</h1>
            <p className="text-muted-foreground text-sm mt-1">Update your service details.</p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="w-4 h-4 mr-1" /> Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Service?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will deactivate your service. It won't appear in the marketplace anymore.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={deleting}>
                  {deleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info */}
          <section className="bg-card rounded-xl border border-border p-4 sm:p-6 space-y-4">
            <h2 className="font-heading text-base font-semibold text-foreground flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" /> Service Details
            </h2>

            <div className="space-y-2">
              <Label htmlFor="title">Service Title *</Label>
              <Input id="title" placeholder="e.g. React & TypeScript Tutoring" {...register("title")} />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Describe your expertise..." rows={3} {...register("description")} />
              {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Category *</Label>
              {categories.length > 0 ? (
                <Select value={watch("category_id")} onValueChange={(val) => setValue("category_id", val)}>
                  <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground">Loading categories...</p>
              )}
              {errors.category_id && <p className="text-sm text-destructive">{errors.category_id.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">
                <Tag className="w-4 h-4 inline mr-1" /> Tags (comma-separated)
              </Label>
              <Input id="tags" placeholder="e.g. React, JavaScript" {...register("tags")} />
            </div>
          </section>

          {/* Pricing */}
          <section className="bg-card rounded-xl border border-border p-4 sm:p-6 space-y-4">
            <h2 className="font-heading text-base font-semibold text-foreground flex items-center gap-2">
              <span className="text-primary text-lg">৳</span> Pricing
            </h2>
            <div className="space-y-2">
              <Label htmlFor="price">Price Per Minute (৳) *</Label>
              <div className="relative max-w-[200px]">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">৳</span>
                <Input id="price" type="number" step="0.01" min="0.01" className="pl-10" {...register("price_per_minute")} />
              </div>
              {errors.price_per_minute && <p className="text-sm text-destructive">{errors.price_per_minute.message}</p>}
              <p className="text-xs text-muted-foreground">
                30-min call = ৳{((watch("price_per_minute") || 0) * 30).toFixed(2)}
              </p>
            </div>
          </section>

          {/* Availability */}
          <section className="bg-card rounded-xl border border-border p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${isAvailable ? "bg-green-500 animate-pulse" : "bg-muted-foreground"}`} />
                <div>
                  <p className="text-sm font-medium text-foreground">{isAvailable ? "Live" : "Offline"}</p>
                  <p className="text-xs text-muted-foreground">Toggle to go live or offline</p>
                </div>
              </div>
              <Switch checked={isAvailable} onCheckedChange={setIsAvailable} />
            </div>
          </section>

          <Button type="submit" variant="hero" size="lg" className="w-full" disabled={submitting}>
            {submitting ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default EditService;

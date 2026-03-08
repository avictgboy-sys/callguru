import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface HomeServiceCategory {
  id: string;
  name: string;
  name_bn: string;
  icon: string;
  slug: string;
  sort_order: number;
}

export interface HomeService {
  id: string;
  provider_id: string;
  category_id: string;
  title: string;
  description: string | null;
  pricing_type: string;
  fixed_price: number | null;
  min_price: number | null;
  max_price: number | null;
  area: string | null;
  is_active: boolean;
  is_available: boolean;
  rating: number;
  total_reviews: number;
  total_jobs: number;
  tags: string[];
  created_at: string;
  profiles?: { full_name: string | null; avatar_url: string | null; is_verified: boolean | null } | null;
  home_service_categories?: { name: string; name_bn: string; icon: string } | null;
}

export interface HomeBooking {
  id: string;
  service_id: string;
  customer_id: string;
  provider_id: string;
  status: string;
  pricing_type: string;
  quoted_price: number | null;
  final_price: number | null;
  advance_paid: number;
  remaining_paid: number;
  platform_fee: number;
  provider_earning: number;
  hold_until: string | null;
  released: boolean;
  problem_description: string | null;
  address: string | null;
  phone: string | null;
  preferred_date: string | null;
  preferred_time: string | null;
  completed_at: string | null;
  customer_confirmed: boolean;
  created_at: string;
}

export const useHomeServiceCategories = () =>
  useQuery({
    queryKey: ["home-service-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("home_service_categories")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as HomeServiceCategory[];
    },
    staleTime: 60 * 60 * 1000,
  });

export const useHomeServices = (categorySlug?: string) =>
  useQuery({
    queryKey: ["home-services", categorySlug],
    queryFn: async () => {
      let query = supabase
        .from("home_services")
        .select("*, home_service_categories(name, name_bn, icon)")
        .eq("is_active", true)
        .order("rating", { ascending: false });

      if (categorySlug) {
        const { data: cat } = await supabase
          .from("home_service_categories")
          .select("id")
          .eq("slug", categorySlug)
          .single();
        if (cat) query = query.eq("category_id", cat.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      const providerIds = [...new Set((data || []).map((s: any) => s.provider_id))];
      let profilesMap: Record<string, any> = {};
      if (providerIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url, is_verified")
          .in("user_id", providerIds);
        profilesMap = Object.fromEntries((profiles || []).map((p: any) => [p.user_id, p]));
      }

      return (data || []).map((s: any) => ({
        ...s,
        profiles: profilesMap[s.provider_id] || null,
      })) as HomeService[];
    },
  });

export const useMyHomeServices = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-home-services", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("home_services")
        .select("*, home_service_categories(name, name_bn, icon)")
        .eq("provider_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as HomeService[];
    },
  });
};

export const useCreateHomeService = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (service: {
      title: string;
      description?: string;
      category_id: string;
      pricing_type: string;
      fixed_price?: number;
      min_price?: number;
      max_price?: number;
      area?: string;
      tags?: string[];
      provider_id: string;
    }) => {
      const { error } = await supabase.from("home_services").insert(service);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["home-services"] });
      qc.invalidateQueries({ queryKey: ["my-home-services"] });
      toast.success("সার্ভিস তৈরি হয়েছে!");
    },
  });
};

export const useMyHomeBookings = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-home-bookings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("home_bookings")
        .select("*")
        .or(`customer_id.eq.${user!.id},provider_id.eq.${user!.id}`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as HomeBooking[];
    },
  });
};

export const useCreateHomeBooking = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (booking: {
      service_id: string;
      customer_id: string;
      provider_id: string;
      pricing_type: string;
      quoted_price?: number;
      problem_description?: string;
      address: string;
      phone: string;
      preferred_date?: string;
      preferred_time?: string;
    }) => {
      const { error } = await supabase.from("home_bookings").insert(booking);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-home-bookings"] });
      toast.success("বুকিং সফল!");
    },
  });
};

export const useAcceptBooking = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ bookingId, quotedPrice }: { bookingId: string; quotedPrice?: number }) => {
      const update: any = { status: "accepted", updated_at: new Date().toISOString() };
      if (quotedPrice) update.quoted_price = quotedPrice;
      const { error } = await supabase.from("home_bookings").update(update).eq("id", bookingId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-home-bookings"] });
      toast.success("বুকিং গ্রহণ করা হয়েছে!");
    },
  });
};

export const usePayAdvance = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (bookingId: string) => {
      const { error } = await supabase.rpc("pay_home_booking_advance", { p_booking_id: bookingId });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-home-bookings"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("অ্যাডভান্স পেমেন্ট সফল!");
    },
  });
};

export const useCompleteBooking = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (bookingId: string) => {
      const { error } = await supabase.rpc("complete_home_booking", { p_booking_id: bookingId });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-home-bookings"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("কাজ সম্পন্ন! পেমেন্ট ৩ দিন হোল্ড থাকবে।");
    },
  });
};

export const useCancelBooking = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (bookingId: string) => {
      const { error } = await supabase
        .from("home_bookings")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", bookingId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-home-bookings"] });
      toast.success("বুকিং বাতিল করা হয়েছে");
    },
  });
};

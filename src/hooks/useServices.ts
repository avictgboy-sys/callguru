import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export interface ServiceWithProvider {
  id: string;
  title: string;
  description: string | null;
  price_per_minute: number;
  rating: number | null;
  total_reviews: number | null;
  total_sessions: number | null;
  is_available: boolean | null;
  tags: string[] | null;
  category_id: string;
  provider_id: string;
  created_at: string;
  service_categories: {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
  } | null;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
    is_verified: boolean | null;
  } | null;
}

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  sort_order: number | null;
}

export const useCategories = () =>
  useQuery({
    queryKey: ["service-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_categories")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as ServiceCategory[];
    },
  });

export const useServices = (categorySlug?: string, search?: string) =>
  useQuery({
    queryKey: ["services", categorySlug, search],
    queryFn: async () => {
      let query = supabase
        .from("services")
        .select(`
          *,
          service_categories!inner(id, name, slug, icon)
        `)
        .eq("is_active", true)
        .order("rating", { ascending: false });

      if (categorySlug && categorySlug !== "all") {
        query = query.eq("service_categories.slug", categorySlug);
      }

      if (search) {
        query = query.ilike("title", `%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch provider profiles separately
      const providerIds = [...new Set((data || []).map((s: any) => s.provider_id))];
      let profilesMap: Record<string, any> = {};
      if (providerIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url, is_verified")
          .in("user_id", providerIds);
        profilesMap = Object.fromEntries((profiles || []).map((p) => [p.user_id, p]));
      }

      return (data || []).map((s: any) => ({
        ...s,
        profiles: profilesMap[s.provider_id] || null,
      })) as unknown as ServiceWithProvider[];
    },
  });

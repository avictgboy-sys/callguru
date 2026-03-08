import { Link } from "react-router-dom";
import { Star, Video, BadgeCheck, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SuggestedService {
  id: string;
  title: string;
  price_per_minute: number;
  rating: number | null;
  total_sessions: number | null;
  provider_id: string;
  is_available: boolean | null;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
    is_verified: boolean | null;
  } | null;
  service_categories: {
    name: string;
    icon: string | null;
  } | null;
}

export const useSuggestedServices = () =>
  useQuery({
    queryKey: ["suggested-services-feed"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("id, title, price_per_minute, rating, total_sessions, provider_id, is_available, service_categories(name, icon)")
        .eq("is_active", true)
        .eq("is_available", true)
        .order("rating", { ascending: false })
        .limit(12);
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
      })) as SuggestedService[];
    },
    staleTime: 5 * 60 * 1000,
  });

interface Props {
  services: SuggestedService[];
  startIndex?: number;
}

const SuggestedServices = ({ services, startIndex = 0 }: Props) => {
  const items = services.slice(startIndex, startIndex + 3);
  if (items.length === 0) return null;

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h3 className="text-[15px] font-semibold text-foreground">
          🎯 সাজেস্টেড এক্সপার্ট
        </h3>
        <Link
          to="/marketplace"
          className="flex items-center gap-0.5 text-xs font-medium text-primary hover:underline"
        >
          সব দেখুন <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="flex gap-3 px-4 pb-4 overflow-x-auto scrollbar-hide">
        {items.map((service) => {
          const name = service.profiles?.full_name || "Expert";
          const initials = name[0].toUpperCase();
          const category = service.service_categories?.name || "General";

          return (
            <Link
              key={service.id}
              to={`/profile/${service.provider_id}`}
              className="shrink-0 w-[160px] rounded-xl border border-border bg-secondary/30 hover:bg-secondary/60 transition-colors overflow-hidden"
            >
              {/* Top section */}
              <div className="flex flex-col items-center pt-4 pb-3 px-3">
                <Avatar className="w-14 h-14 mb-2 border-2 border-primary/20">
                  <AvatarImage src={service.profiles?.avatar_url || ""} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-semibold text-foreground truncate max-w-[120px]">
                    {name}
                  </span>
                  {service.profiles?.is_verified && (
                    <BadgeCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                  )}
                </div>
                <span className="text-[11px] text-muted-foreground">{category}</span>
              </div>

              {/* Stats */}
              <div className="flex items-center justify-center gap-3 px-3 pb-2 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-0.5">
                  <Star className="w-3 h-3" style={{ color: 'hsl(var(--star, 45 93% 47%))', fill: 'hsl(var(--star, 45 93% 47%))' }} />
                  {(service.rating ?? 0).toFixed(1)}
                </span>
                <span className="flex items-center gap-0.5">
                  <Video className="w-3 h-3" />
                  {service.total_sessions ?? 0}
                </span>
              </div>

              {/* Price + CTA */}
              <div className="border-t border-border px-3 py-2.5 text-center">
                <span className="text-primary font-bold text-sm">৳{service.price_per_minute}</span>
                <span className="text-[10px] text-muted-foreground">/min</span>
                <div className="mt-1.5">
                  <Button variant="outline" size="sm" className="w-full h-7 text-xs rounded-full">
                    <Video className="w-3 h-3 mr-1" />
                    কল করুন
                  </Button>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default SuggestedServices;

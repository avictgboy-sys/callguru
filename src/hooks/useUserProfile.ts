import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

export const useUserProfile = (userId: string) => {
  return useQuery({
    queryKey: ["user-profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles_public")
        .select("*")
        .eq("user_id", userId)
        .single();
      if (error) throw error;
      return data;
    },
  });
};

export const useUserPosts = (userId: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["user-posts", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data: posts, error } = await supabase
        .from("posts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;

      let likedPostIds = new Set<string>();
      if (user) {
        const { data: likes } = await supabase
          .from("likes")
          .select("post_id")
          .eq("user_id", user.id);
        likedPostIds = new Set((likes || []).map((l: any) => l.post_id));
      }

      const { data: profile } = await supabase
        .from("profiles_public")
        .select("user_id, full_name, avatar_url, is_verified")
        .eq("user_id", userId)
        .single();

      return (posts || []).map((p: any) => ({
        ...p,
        author: profile || null,
        liked_by_me: likedPostIds.has(p.id),
      }));
    },
  });
};

export const useUserServices = (userId: string) => {
  return useQuery({
    queryKey: ["user-services", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*, service_categories(id, name, slug, icon)")
        .eq("provider_id", userId)
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const { data: profile } = await supabase
        .from("profiles_public")
        .select("user_id, full_name, avatar_url, is_verified")
        .eq("user_id", userId)
        .single();

      return (data || []).map((s: any) => ({
        ...s,
        profiles: profile || null,
      }));
    },
  });
};

export const useUserFollowers = (userId: string) => {
  return useQuery({
    queryKey: ["user-followers", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("following_id", userId);
      if (error) throw error;
      if (!data?.length) return [];

      const ids = data.map((f: any) => f.follower_id);
      const { data: profiles } = await supabase
        .from("profiles_public")
        .select("user_id, full_name, avatar_url, is_verified")
        .in("user_id", ids);
      return profiles || [];
    },
  });
};

export const useUserFollowing = (userId: string) => {
  return useQuery({
    queryKey: ["user-following", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", userId);
      if (error) throw error;
      if (!data?.length) return [];

      const ids = data.map((f: any) => f.following_id);
      const { data: profiles } = await supabase
        .from("profiles_public")
        .select("user_id, full_name, avatar_url, is_verified")
        .in("user_id", ids);
      return profiles || [];
    },
  });
};

export const useIsFollowing = (targetUserId: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["is-following", user?.id, targetUserId],
    enabled: !!user && !!targetUserId && user.id !== targetUserId,
    queryFn: async () => {
      const { data } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", user!.id)
        .eq("following_id", targetUserId)
        .maybeSingle();
      return !!data;
    },
  });
};

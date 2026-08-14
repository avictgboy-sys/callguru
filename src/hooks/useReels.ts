import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Reel {
  id: string;
  user_id: string;
  video_url: string;
  caption: string | null;
  thumbnail_url: string | null;
  likes_count: number;
  comments_count: number;
  views_count: number;
  created_at: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  is_liked?: boolean;
}

export interface ReelComment {
  id: string;
  reel_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export function useReels() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["reels"],
    queryFn: async () => {
      const { data: reels, error } = await supabase
        .from("reels")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Fetch profiles and likes in parallel
      const userIds = [...new Set((reels || []).map((r: any) => r.user_id))];
      const reelIds = (reels || []).map((r: any) => r.id);

      const [profilesRes, likesRes] = await Promise.all([
        userIds.length > 0
          ? supabase.from("profiles_public").select("user_id, full_name, avatar_url").in("user_id", userIds)
          : { data: [] },
        user && reelIds.length > 0
          ? supabase.from("reel_likes").select("reel_id").eq("user_id", user.id).in("reel_id", reelIds)
          : { data: [] },
      ]);

      const profileMap = new Map((profilesRes.data || []).map((p: any) => [p.user_id, p]));
      const likedSet = new Set((likesRes.data || []).map((l: any) => l.reel_id));

      return (reels || []).map((r: any) => ({
        ...r,
        profile: profileMap.get(r.user_id) || { full_name: "Unknown", avatar_url: null },
        is_liked: likedSet.has(r.id),
      })) as Reel[];
    },
  });
}

export function useCreateReel() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ video_url, caption }: { video_url: string; caption?: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("reels")
        .insert({ user_id: user.id, video_url, caption: caption || null });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reels"] });
      toast.success("Reel posted!");
    },
    onError: () => toast.error("Failed to post reel"),
  });
}

export function useToggleReelLike() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ reelId, isLiked }: { reelId: string; isLiked: boolean }) => {
      if (!user) throw new Error("Not authenticated");
      if (isLiked) {
        await supabase.from("reel_likes").delete().eq("reel_id", reelId).eq("user_id", user.id);
      } else {
        await supabase.from("reel_likes").insert({ reel_id: reelId, user_id: user.id });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reels"] }),
  });
}

export function useReelComments(reelId: string | null) {
  return useQuery({
    queryKey: ["reel-comments", reelId],
    enabled: !!reelId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reel_comments")
        .select("*")
        .eq("reel_id", reelId!)
        .order("created_at", { ascending: true });
      if (error) throw error;

      const userIds = [...new Set((data || []).map((c: any) => c.user_id))];
      const { data: profiles } = userIds.length > 0
        ? await supabase.from("profiles_public").select("user_id, full_name, avatar_url").in("user_id", userIds)
        : { data: [] };

      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
      return (data || []).map((c: any) => ({
        ...c,
        profile: profileMap.get(c.user_id) || { full_name: "Unknown", avatar_url: null },
      })) as ReelComment[];
    },
  });
}

export function useCreateReelComment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ reelId, content }: { reelId: string; content: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("reel_comments")
        .insert({ reel_id: reelId, user_id: user.id, content });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["reel-comments", vars.reelId] });
      queryClient.invalidateQueries({ queryKey: ["reels"] });
    },
    onError: () => toast.error("Failed to post comment"),
  });
}

export function useDeleteReel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reelId: string) => {
      const { error } = await supabase.from("reels").delete().eq("id", reelId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reels"] });
      toast.success("রিল মুছে ফেলা হয়েছে");
    },
    onError: () => toast.error("রিল মুছতে ব্যর্থ"),
  });
}

export function useIncrementReelViews() {
  return useMutation({
    mutationFn: async (reelId: string) => {
      const { error } = await supabase.rpc("increment_reel_views", { p_reel_id: reelId });
      if (error) throw error;
    },
  });
}

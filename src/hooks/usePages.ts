import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

export const usePages = () =>
  useQuery({
    queryKey: ["pages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pages" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

export const usePageDetail = (pageId: string | undefined) =>
  useQuery({
    queryKey: ["page", pageId],
    enabled: !!pageId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pages" as any)
        .select("*")
        .eq("id", pageId!)
        .single();
      if (error) throw error;
      return data as any;
    },
  });

export const usePagePosts = (pageId: string | undefined) =>
  useQuery({
    queryKey: ["page-posts", pageId],
    enabled: !!pageId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("page_posts" as any)
        .select("*")
        .eq("page_id", pageId!)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const userIds = [...new Set((data || []).map((p: any) => p.user_id))];
      let profileMap: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", userIds);
        profileMap = Object.fromEntries(
          (profiles || []).map((p) => [p.user_id, p])
        );
      }

      return (data || []).map((p: any) => ({
        ...p,
        author: profileMap[p.user_id] || null,
      }));
    },
  });

export const useMyPageFollow = (pageId: string | undefined) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-page-follow", pageId, user?.id],
    enabled: !!pageId && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("page_followers" as any)
        .select("*")
        .eq("page_id", pageId!)
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as any | null;
    },
  });
};

export const useCreatePage = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (vals: { name: string; description?: string; category?: string; cover_image_url?: string; avatar_url?: string }) => {
      const { data, error } = await supabase
        .from("pages" as any)
        .insert({ ...vals, creator_id: user!.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pages"] }),
  });
};

export const useFollowPage = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (pageId: string) => {
      const { error } = await supabase.from("page_followers" as any).insert({
        page_id: pageId,
        user_id: user!.id,
      } as any);
      if (error) throw error;
    },
    onSuccess: (_, pageId) => {
      qc.invalidateQueries({ queryKey: ["my-page-follow", pageId] });
      qc.invalidateQueries({ queryKey: ["page", pageId] });
      qc.invalidateQueries({ queryKey: ["pages"] });
    },
  });
};

export const useUnfollowPage = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (pageId: string) => {
      const { error } = await supabase
        .from("page_followers" as any)
        .delete()
        .eq("page_id", pageId)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: (_, pageId) => {
      qc.invalidateQueries({ queryKey: ["my-page-follow", pageId] });
      qc.invalidateQueries({ queryKey: ["page", pageId] });
      qc.invalidateQueries({ queryKey: ["pages"] });
    },
  });
};

export const useCreatePagePost = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ pageId, content, image_url }: { pageId: string; content: string; image_url?: string }) => {
      const { error } = await supabase.from("page_posts" as any).insert({
        page_id: pageId,
        user_id: user!.id,
        content,
        image_url,
      } as any);
      if (error) throw error;
    },
    onSuccess: (_, { pageId }) => {
      qc.invalidateQueries({ queryKey: ["page-posts", pageId] });
    },
  });
};

import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

export interface PostWithAuthor {
  id: string;
  user_id: string;
  content: string | null;
  image_url: string | null;
  video_url: string | null;
  post_type: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  created_at: string;
  author: {
    full_name: string | null;
    avatar_url: string | null;
    is_verified: boolean | null;
  } | null;
  liked_by_me: boolean;
}

export interface CommentWithAuthor {
  id: string;
  user_id: string;
  post_id: string;
  content: string;
  created_at: string;
  author: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export const useFeedPosts = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["feed-posts", user?.id],
    queryFn: async () => {
      const { data: posts, error } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      const userIds = [...new Set((posts || []).map((p: any) => p.user_id))];
      let profilesMap: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url, is_verified")
          .in("user_id", userIds);
        profilesMap = Object.fromEntries((profiles || []).map((p: any) => [p.user_id, p]));
      }

      let likedPostIds = new Set<string>();
      if (user) {
        const { data: likes } = await supabase
          .from("likes")
          .select("post_id")
          .eq("user_id", user.id);
        likedPostIds = new Set((likes || []).map((l: any) => l.post_id));
      }

      return (posts || []).map((p: any) => ({
        ...p,
        author: profilesMap[p.user_id] || null,
        liked_by_me: likedPostIds.has(p.id),
      })) as PostWithAuthor[];
    },
  });
};

export const useCreatePost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (post: { content?: string; image_url?: string; video_url?: string; post_type: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("posts").insert({
        user_id: user.id,
        content: post.content || null,
        image_url: post.image_url || null,
        video_url: post.video_url || null,
        post_type: post.post_type,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feed-posts"] }),
  });
};

export const useUpdatePost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("posts")
        .update({ content, updated_at: new Date().toISOString() })
        .eq("id", postId)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feed-posts"] }),
  });
};

export const useDeletePost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("posts").delete().eq("id", postId).eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feed-posts"] }),
  });
};

export const useToggleLike = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, liked }: { postId: string; liked: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      if (liked) {
        await supabase.from("likes").delete().eq("user_id", user.id).eq("post_id", postId);
      } else {
        await supabase.from("likes").insert({ user_id: user.id, post_id: postId });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feed-posts"] }),
  });
};

export const usePostComments = (postId: string) =>
  useQuery({
    queryKey: ["comments", postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
      if (error) throw error;

      const userIds = [...new Set((data || []).map((c: any) => c.user_id))];
      let profilesMap: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", userIds);
        profilesMap = Object.fromEntries((profiles || []).map((p: any) => [p.user_id, p]));
      }

      return (data || []).map((c: any) => ({
        ...c,
        author: profilesMap[c.user_id] || null,
      })) as CommentWithAuthor[];
    },
    enabled: !!postId,
  });

export const useCreateComment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("comments").insert({
        user_id: user.id,
        post_id: postId,
        content,
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["comments", vars.postId] });
      qc.invalidateQueries({ queryKey: ["feed-posts"] });
    },
  });
};

export const useFollowUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ targetUserId, isFollowing }: { targetUserId: string; isFollowing: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      if (isFollowing) {
        await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", targetUserId);
      } else {
        await supabase.from("follows").insert({ follower_id: user.id, following_id: targetUserId });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feed-posts"] });
      qc.invalidateQueries({ queryKey: ["user-profile"] });
    },
  });
};

import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

export const useGroups = () =>
  useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("groups" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

export const useGroupDetail = (groupId: string | undefined) =>
  useQuery({
    queryKey: ["group", groupId],
    enabled: !!groupId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("groups" as any)
        .select("*")
        .eq("id", groupId!)
        .single();
      if (error) throw error;
      return data as any;
    },
  });

export const useGroupMembers = (groupId: string | undefined) =>
  useQuery({
    queryKey: ["group-members", groupId],
    enabled: !!groupId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("group_members" as any)
        .select("*")
        .eq("group_id", groupId!)
        .eq("status", "approved");
      if (error) throw error;

      const userIds = (data || []).map((m: any) => m.user_id);
      if (userIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);

      const profileMap = Object.fromEntries(
        (profiles || []).map((p) => [p.user_id, p])
      );

      return (data || []).map((m: any) => ({
        ...m,
        profile: profileMap[m.user_id] || null,
      }));
    },
  });

export const useGroupPosts = (groupId: string | undefined) =>
  useQuery({
    queryKey: ["group-posts", groupId],
    enabled: !!groupId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("group_posts" as any)
        .select("*")
        .eq("group_id", groupId!)
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

export const useMyMembership = (groupId: string | undefined) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-membership", groupId, user?.id],
    enabled: !!groupId && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("group_members" as any)
        .select("*")
        .eq("group_id", groupId!)
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as any | null;
    },
  });
};

export const useCreateGroup = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (vals: { name: string; description?: string; privacy: string; cover_image_url?: string }) => {
      const { data, error } = await supabase
        .from("groups" as any)
        .insert({ ...vals, creator_id: user!.id } as any)
        .select()
        .single();
      if (error) throw error;
      // Auto-join as admin
      await supabase.from("group_members" as any).insert({
        group_id: (data as any).id,
        user_id: user!.id,
        role: "admin",
        status: "approved",
      } as any);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["groups"] }),
  });
};

export const useJoinGroup = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ groupId, privacy }: { groupId: string; privacy: string }) => {
      const status = privacy === "public" ? "approved" : "pending";
      const { error } = await supabase.from("group_members" as any).insert({
        group_id: groupId,
        user_id: user!.id,
        role: "member",
        status,
      } as any);
      if (error) throw error;
    },
    onSuccess: (_, { groupId }) => {
      qc.invalidateQueries({ queryKey: ["my-membership", groupId] });
      qc.invalidateQueries({ queryKey: ["group", groupId] });
      qc.invalidateQueries({ queryKey: ["groups"] });
    },
  });
};

export const useLeaveGroup = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (groupId: string) => {
      const { error } = await supabase
        .from("group_members" as any)
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: (_, groupId) => {
      qc.invalidateQueries({ queryKey: ["my-membership", groupId] });
      qc.invalidateQueries({ queryKey: ["group", groupId] });
      qc.invalidateQueries({ queryKey: ["groups"] });
    },
  });
};

export const useCreateGroupPost = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ groupId, content, image_url }: { groupId: string; content: string; image_url?: string }) => {
      const { error } = await supabase.from("group_posts" as any).insert({
        group_id: groupId,
        user_id: user!.id,
        content,
        image_url,
      } as any);
      if (error) throw error;
    },
    onSuccess: (_, { groupId }) => {
      qc.invalidateQueries({ queryKey: ["group-posts", groupId] });
    },
  });
};

export const usePendingMembers = (groupId: string | undefined) =>
  useQuery({
    queryKey: ["pending-members", groupId],
    enabled: !!groupId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("group_members" as any)
        .select("*")
        .eq("group_id", groupId!)
        .eq("status", "pending");
      if (error) throw error;

      const userIds = (data || []).map((m: any) => m.user_id);
      if (userIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);

      const profileMap = Object.fromEntries(
        (profiles || []).map((p) => [p.user_id, p])
      );

      return (data || []).map((m: any) => ({
        ...m,
        profile: profileMap[m.user_id] || null,
      }));
    },
  });

export const useApproveMember = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ memberId, groupId }: { memberId: string; groupId: string }) => {
      const { error } = await supabase
        .from("group_members" as any)
        .update({ status: "approved" } as any)
        .eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: (_, { groupId }) => {
      qc.invalidateQueries({ queryKey: ["pending-members", groupId] });
      qc.invalidateQueries({ queryKey: ["group-members", groupId] });
      qc.invalidateQueries({ queryKey: ["group", groupId] });
    },
  });
};

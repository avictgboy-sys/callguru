import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const useAdminStats = () =>
  useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [users, services, posts, roles, payments] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("services").select("id", { count: "exact", head: true }),
        supabase.from("posts").select("id", { count: "exact", head: true }),
        supabase.from("user_roles").select("role"),
        supabase.from("payment_requests").select("*"),
      ]);

      const providerCount = (roles.data || []).filter((r: any) => r.role === "provider").length;
      const adminCount = (roles.data || []).filter((r: any) => r.role === "admin").length;

      const paymentData = payments.data || [];
      const pendingPayments = paymentData.filter((p: any) => p.status === "pending").length;
      const today = new Date().toISOString().slice(0, 10);
      const approvedToday = paymentData.filter(
        (p: any) => p.status === "completed" && p.updated_at?.slice(0, 10) === today
      ).length;
      const totalVolume = paymentData
        .filter((p: any) => p.status === "completed")
        .reduce((sum: number, p: any) => sum + Number(p.amount), 0);

      return {
        totalUsers: users.count || 0,
        totalServices: services.count || 0,
        totalPosts: posts.count || 0,
        totalProviders: providerCount,
        totalAdmins: adminCount,
        pendingPayments,
        approvedToday,
        totalVolume,
      };
    },
  });

export interface AdminUser {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  bio: string | null;
  is_verified: boolean | null;
  wallet_balance: number | null;
  points: number | null;
  referral_code: string | null;
  created_at: string;
  followers_count: number;
  following_count: number;
  roles: string[];
}

export const useAdminUsers = () =>
  useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const userIds = (profiles || []).map((p: any) => p.user_id);
      const { data: allRoles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);

      const rolesMap: Record<string, string[]> = {};
      (allRoles || []).forEach((r: any) => {
        if (!rolesMap[r.user_id]) rolesMap[r.user_id] = [];
        rolesMap[r.user_id].push(r.role);
      });

      return (profiles || []).map((p: any) => ({
        ...p,
        roles: rolesMap[p.user_id] || ["user"],
      })) as AdminUser[];
    },
  });

export const useVerifyUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, verified }: { userId: string; verified: boolean }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ is_verified: verified })
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });
};

export const useToggleUserRole = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role, add }: { userId: string; role: string; add: boolean }) => {
      if (add) {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: role as any });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", role as any);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });
};

export const useAdminPosts = () =>
  useQuery({
    queryKey: ["admin-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;

      const userIds = [...new Set((data || []).map((p: any) => p.user_id))];
      let profilesMap: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", userIds);
        profilesMap = Object.fromEntries((profiles || []).map((p: any) => [p.user_id, p]));
      }

      return (data || []).map((p: any) => ({
        ...p,
        author: profilesMap[p.user_id] || null,
      }));
    },
  });

export const useDeletePost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase.from("posts").delete().eq("id", postId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-posts"] }),
  });
};

export const useAdminServices = () =>
  useQuery({
    queryKey: ["admin-services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*, service_categories(name, slug)")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const providerIds = [...new Set((data || []).map((s: any) => s.provider_id))];
      let profilesMap: Record<string, any> = {};
      if (providerIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", providerIds);
        profilesMap = Object.fromEntries((profiles || []).map((p: any) => [p.user_id, p]));
      }

      return (data || []).map((s: any) => ({
        ...s,
        provider: profilesMap[s.provider_id] || null,
      }));
    },
  });

export const useToggleService = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("services")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-services"] }),
  });
};

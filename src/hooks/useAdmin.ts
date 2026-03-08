import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const useAdminStats = () =>
  useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [users, services, posts, roles, payments, calls] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("services").select("id", { count: "exact", head: true }),
        supabase.from("posts").select("id", { count: "exact", head: true }),
        supabase.from("user_roles").select("role"),
        supabase.from("payment_requests").select("*"),
        supabase.from("calls").select("id, status, total_cost, platform_fee, duration_minutes, created_at"),
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

      // Call/revenue stats
      const callData = calls.data || [];
      const completedCalls = callData.filter((c: any) => c.status === "completed");
      const totalCalls = completedCalls.length;
      const totalRevenue = completedCalls.reduce((s: number, c: any) => s + Number(c.platform_fee || 0), 0);
      const totalCallVolume = completedCalls.reduce((s: number, c: any) => s + Number(c.total_cost || 0), 0);
      const totalMinutes = completedCalls.reduce((s: number, c: any) => s + Number(c.duration_minutes || 0), 0);
      const todayCalls = completedCalls.filter((c: any) => c.created_at?.slice(0, 10) === today).length;
      const todayRevenue = completedCalls
        .filter((c: any) => c.created_at?.slice(0, 10) === today)
        .reduce((s: number, c: any) => s + Number(c.platform_fee || 0), 0);

      return {
        totalUsers: users.count || 0,
        totalServices: services.count || 0,
        totalPosts: posts.count || 0,
        totalProviders: providerCount,
        totalAdmins: adminCount,
        pendingPayments,
        approvedToday,
        totalVolume,
        totalCalls,
        totalRevenue,
        totalCallVolume,
        totalMinutes,
        todayCalls,
        todayRevenue,
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

export interface ActivityItem {
  id: string;
  type: "payment" | "call" | "dispute" | "user" | "post";
  title: string;
  detail: string;
  time: string;
}

export const useRecentActivity = () =>
  useQuery({
    queryKey: ["admin-recent-activity"],
    queryFn: async () => {
      const [payments, calls, disputes, users, posts] = await Promise.all([
        supabase.from("payment_requests").select("id, type, method, amount, status, created_at, user_id").order("created_at", { ascending: false }).limit(5),
        supabase.from("calls").select("id, status, total_cost, duration_minutes, created_at, caller_id").order("created_at", { ascending: false }).limit(5),
        supabase.from("disputes").select("id, reason, status, created_at, complainant_id").order("created_at", { ascending: false }).limit(5),
        supabase.from("profiles").select("user_id, full_name, created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("posts").select("id, content, created_at, user_id").order("created_at", { ascending: false }).limit(5),
      ]);

      const activities: ActivityItem[] = [];

      (payments.data || []).forEach((p: any) => {
        activities.push({
          id: `pay-${p.id}`,
          type: "payment",
          title: `${p.type === "topup" ? "Top-up" : "Withdrawal"} request`,
          detail: `৳${p.amount} via ${p.method} — ${p.status}`,
          time: p.created_at,
        });
      });

      (calls.data || []).forEach((c: any) => {
        activities.push({
          id: `call-${c.id}`,
          type: "call",
          title: `Call ${c.status}`,
          detail: c.total_cost ? `৳${Number(c.total_cost).toFixed(2)} • ${Number(c.duration_minutes || 0).toFixed(0)} min` : "In progress",
          time: c.created_at,
        });
      });

      (disputes.data || []).forEach((d: any) => {
        activities.push({
          id: `disp-${d.id}`,
          type: "dispute",
          title: `Dispute: ${d.reason}`,
          detail: d.status,
          time: d.created_at,
        });
      });

      (users.data || []).forEach((u: any) => {
        activities.push({
          id: `user-${u.user_id}`,
          type: "user",
          title: "New user joined",
          detail: u.full_name || "Unknown",
          time: u.created_at,
        });
      });

      (posts.data || []).forEach((p: any) => {
        activities.push({
          id: `post-${p.id}`,
          type: "post",
          title: "New post",
          detail: (p.content || "").slice(0, 60) || "—",
          time: p.created_at,
        });
      });

      activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      return activities.slice(0, 15);
    },
  });

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useIsFollowing(targetUserId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["is-following", user?.id, targetUserId],
    enabled: !!user && !!targetUserId && user.id !== targetUserId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", user!.id)
        .eq("following_id", targetUserId!)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });
}

export function useToggleFollow() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ targetUserId, isFollowing }: { targetUserId: string; isFollowing: boolean }) => {
      if (!user) throw new Error("Not authenticated");
      if (isFollowing) {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", targetUserId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("follows")
          .insert({ follower_id: user.id, following_id: targetUserId });
        if (error) throw error;
      }
    },
    onSuccess: (_, { targetUserId, isFollowing }) => {
      queryClient.invalidateQueries({ queryKey: ["is-following"] });
      queryClient.invalidateQueries({ queryKey: ["reels"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      toast.success(isFollowing ? "আনফলো করা হয়েছে" : "ফলো করা হয়েছে");
    },
    onError: () => toast.error("ব্যর্থ হয়েছে"),
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Call {
  id: string;
  caller_id: string;
  provider_id: string;
  service_id: string;
  price_per_minute: number;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  total_cost: number | null;
  platform_fee: number | null;
  provider_earning: number | null;
  status: string;
  created_at: string;
}

export const useCalls = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["calls", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("calls")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as Call[];
    },
  });
};

/**
 * Check if a user is currently in an active call.
 * Used for busy detection before starting a new call.
 */
export const checkUserBusy = async (userId: string): Promise<boolean> => {
  const { data } = await supabase
    .from("calls")
    .select("id")
    .or(`caller_id.eq.${userId},provider_id.eq.${userId}`)
    .eq("status", "active")
    .limit(1);
  return (data?.length ?? 0) > 0;
};

export const useStartCall = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (params: {
      provider_id: string;
      service_id: string;
      price_per_minute: number;
    }) => {
      // 1. Check if caller is already in a call
      const callerBusy = await checkUserBusy(user!.id);
      if (callerBusy) throw new Error("আপনি ইতিমধ্যে একটি কলে আছেন।");

      // 2. Check if provider is already in a call
      const providerBusy = await checkUserBusy(params.provider_id);
      if (providerBusy) throw new Error("প্রোভাইডার এখন ব্যস্ত। কিছুক্ষণ পর চেষ্টা করুন।");

      // 3. Create the call
      const { data, error } = await supabase
        .from("calls")
        .insert({
          caller_id: user!.id,
          provider_id: params.provider_id,
          service_id: params.service_id,
          price_per_minute: params.price_per_minute,
        })
        .select()
        .single();
      if (error) throw error;
      return data as Call;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["calls"] });
    },
  });
};

export const useCompleteCall = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      call_id: string;
      duration_minutes: number;
    }) => {
      const { error } = await supabase.rpc("complete_call", {
        p_call_id: params.call_id,
        p_duration_minutes: params.duration_minutes,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["calls"] });
      qc.invalidateQueries({ queryKey: ["wallet-transactions"] });
    },
  });
};

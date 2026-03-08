import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface WalletTransaction {
  id: string;
  user_id: string;
  type: "topup" | "withdraw" | "earning" | "spending";
  amount: number;
  description: string | null;
  status: string;
  created_at: string;
}

export const useWalletTransactions = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["wallet-transactions", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as WalletTransaction[];
    },
  });
};

export const useTopUp = () => {
  const qc = useQueryClient();
  const { refreshProfile } = useAuth();
  return useMutation({
    mutationFn: async (amount: number) => {
      const { error } = await supabase.rpc("wallet_topup", { p_amount: amount });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wallet-transactions"] });
      refreshProfile();
    },
  });
};

export const useWithdraw = () => {
  const qc = useQueryClient();
  const { refreshProfile } = useAuth();
  return useMutation({
    mutationFn: async (amount: number) => {
      const { error } = await supabase.rpc("wallet_withdraw", { p_amount: amount });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wallet-transactions"] });
      refreshProfile();
    },
  });
};

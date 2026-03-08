import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AppSetting {
  id: string;
  key: string;
  value: string;
  description: string | null;
  updated_at: string;
}

export const useAppSettings = () => {
  return useQuery({
    queryKey: ["app-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("*");
      if (error) throw error;
      return data as AppSetting[];
    },
  });
};

export const useSetting = (key: string) => {
  const { data: settings } = useAppSettings();
  return settings?.find((s) => s.key === key)?.value ?? "";
};

export const useMerchantNumbers = () => {
  const { data: settings, isLoading } = useAppSettings();
  const get = (key: string) => settings?.find((s) => s.key === key)?.value ?? "";
  return {
    isLoading,
    bkash: get("merchant_bkash"),
    nagad: get("merchant_nagad"),
    rocket: get("merchant_rocket"),
    bankName: get("bank_name"),
    bankAccountName: get("bank_account_name"),
    bankAccountNumber: get("bank_account_number"),
    bankBranch: get("bank_branch"),
    bankRouting: get("bank_routing"),
  };
};

export const useFeeSettings = () => {
  const { data: settings, isLoading } = useAppSettings();
  const getNum = (key: string, fallback: number) => {
    const val = settings?.find((s) => s.key === key)?.value;
    const num = val ? parseFloat(val) : NaN;
    return isNaN(num) ? fallback : num;
  };
  return {
    isLoading,
    minDeposit: getNum("min_deposit", 100),
    minWithdraw: getNum("min_withdraw", 1000),
    withdrawFeePercent: getNum("withdraw_fee_percent", 2),
    callFeePercent: getNum("call_fee_percent", 1),
  };
};

export const useUpdateSetting = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase
        .from("app_settings")
        .update({ value, updated_at: new Date().toISOString() })
        .eq("key", key);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["app-settings"] });
    },
  });
};

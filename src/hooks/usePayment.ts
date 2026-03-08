import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type PaymentMethod = "stripe" | "bkash" | "nagad" | "rocket" | "bank_transfer";
export type PaymentStatus = "pending" | "completed" | "rejected" | "cancelled";

export interface PaymentRequest {
  id: string;
  user_id: string;
  amount: number;
  method: PaymentMethod;
  type: string;
  status: PaymentStatus;
  reference_id: string | null;
  proof_url: string | null;
  bank_details: Record<string, string> | null;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
}

export const usePaymentRequests = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["payment-requests", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_requests")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as PaymentRequest[];
    },
  });
};

export const useCreatePaymentRequest = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (params: {
      amount: number;
      method: PaymentMethod;
      type: "topup" | "withdraw";
      reference_id?: string;
      proof_url?: string;
      bank_details?: Record<string, string>;
    }) => {
      const { error } = await supabase.from("payment_requests").insert({
        user_id: user!.id,
        amount: params.amount,
        method: params.method,
        type: params.type,
        reference_id: params.reference_id || null,
        proof_url: params.proof_url || null,
        bank_details: params.bank_details || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payment-requests"] });
    },
  });
};

export const useUploadProof = () => {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (file: File) => {
      const ext = file.name.split(".").pop();
      const path = `${user!.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("payment-proofs")
        .upload(path, file);
      if (error) throw error;
      return path;
    },
  });
};

export const PAYMENT_METHODS: {
  id: PaymentMethod;
  name: string;
  description: string;
  available: boolean;
  icon: string;
}[] = [
  { id: "stripe", name: "Card / International", description: "Visa, Mastercard, etc.", available: false, icon: "💳" },
  { id: "bkash", name: "bKash", description: "Mobile banking", available: true, icon: "🟠" },
  { id: "nagad", name: "Nagad", description: "Digital payment", available: true, icon: "🔴" },
  { id: "rocket", name: "Rocket (DBBL)", description: "Mobile banking", available: true, icon: "🟣" },
  { id: "bank_transfer", name: "Bank Transfer", description: "Manual transfer", available: true, icon: "🏦" },
];

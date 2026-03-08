import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LiveChannel {
  id: string;
  name: string;
  logo_url: string | null;
  stream_url: string;
  category: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useLiveChannels = () => {
  return useQuery({
    queryKey: ["live-channels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("live_channels" as any)
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as unknown as LiveChannel[];
    },
  });
};

export const useAllLiveChannels = () => {
  return useQuery({
    queryKey: ["live-channels-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("live_channels" as any)
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as unknown as LiveChannel[];
    },
  });
};

export const useCreateChannel = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (channel: { name: string; stream_url: string; logo_url?: string; category?: string; sort_order?: number }) => {
      const { data, error } = await supabase
        .from("live_channels" as any)
        .insert(channel)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["live-channels"] });
      qc.invalidateQueries({ queryKey: ["live-channels-admin"] });
    },
  });
};

export const useUpdateChannel = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<LiveChannel> & { id: string }) => {
      const { error } = await supabase
        .from("live_channels" as any)
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["live-channels"] });
      qc.invalidateQueries({ queryKey: ["live-channels-admin"] });
    },
  });
};

export const useDeleteChannel = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("live_channels" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["live-channels"] });
      qc.invalidateQueries({ queryKey: ["live-channels-admin"] });
    },
  });
};

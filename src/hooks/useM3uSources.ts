import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface M3uSource {
  id: string;
  name: string;
  url: string;
  is_active: boolean;
  last_imported_at: string | null;
  channel_count: number;
  created_at: string;
  updated_at: string;
}

export const useM3uSources = () => {
  return useQuery({
    queryKey: ["m3u-sources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("m3u_sources" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as M3uSource[];
    },
  });
};

export const useCreateM3uSource = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (source: { name: string; url: string }) => {
      const { data, error } = await supabase
        .from("m3u_sources" as any)
        .insert(source)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["m3u-sources"] }),
  });
};

export const useUpdateM3uSource = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<M3uSource> & { id: string }) => {
      const { error } = await supabase
        .from("m3u_sources" as any)
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["m3u-sources"] }),
  });
};

export const useDeleteM3uSource = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("m3u_sources" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["m3u-sources"] }),
  });
};

import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export interface ChatWithProfile {
  id: string;
  user1_id: string;
  user2_id: string;
  last_message_text: string | null;
  last_message_at: string | null;
  created_at: string;
  other_user: {
    user_id: string;
    full_name: string | null;
    avatar_url: string | null;
    is_verified: boolean | null;
  } | null;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export const useMyChats = (userId: string | undefined) =>
  useQuery({
    queryKey: ["my-chats", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chats")
        .select("*")
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order("last_message_at", { ascending: false, nullsFirst: false });
      if (error) throw error;

      // Get other user profiles
      const otherIds = [
        ...new Set(
          (data || []).map((c: any) =>
            c.user1_id === userId ? c.user2_id : c.user1_id
          )
        ),
      ];

      let profilesMap: Record<string, any> = {};
      if (otherIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url, is_verified")
          .in("user_id", otherIds);
        profilesMap = Object.fromEntries(
          (profiles || []).map((p: any) => [p.user_id, p])
        );
      }

      return (data || []).map((c: any) => {
        const otherId = c.user1_id === userId ? c.user2_id : c.user1_id;
        return {
          ...c,
          other_user: profilesMap[otherId] || null,
        };
      }) as ChatWithProfile[];
    },
  });

export const useChatMessages = (chatId: string | undefined) =>
  useQuery({
    queryKey: ["chat-messages", chatId],
    enabled: !!chatId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("chat_id", chatId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Message[];
    },
  });

export const useSendMessage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      chatId,
      content,
    }: {
      chatId: string;
      content: string;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("messages").insert({
        chat_id: chatId,
        sender_id: user.id,
        content,
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["chat-messages", vars.chatId] });
      qc.invalidateQueries({ queryKey: ["my-chats"] });
    },
  });
};

export const useStartChat = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (otherUserId: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Sort IDs so user1 < user2 to enforce unique constraint
      const [u1, u2] =
        user.id < otherUserId
          ? [user.id, otherUserId]
          : [otherUserId, user.id];

      // Check if chat exists
      const { data: existing } = await supabase
        .from("chats")
        .select("id")
        .eq("user1_id", u1)
        .eq("user2_id", u2)
        .maybeSingle();

      if (existing) return existing.id as string;

      const { data, error } = await supabase
        .from("chats")
        .insert({ user1_id: u1, user2_id: u2 })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-chats"] });
    },
  });
};

/** Subscribe to new messages in a chat via realtime */
export const useRealtimeMessages = (chatId: string | undefined) => {
  const qc = useQueryClient();

  useEffect(() => {
    if (!chatId) return;

    const channel = supabase
      .channel(`messages-${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${chatId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ["chat-messages", chatId] });
          qc.invalidateQueries({ queryKey: ["my-chats"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, qc]);
};

/** Search users to start a new chat */
export const useSearchUsers = (query: string) =>
  useQuery({
    queryKey: ["search-users", query],
    enabled: query.length >= 2,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, is_verified")
        .ilike("full_name", `%${query}%`)
        .limit(10);
      if (error) throw error;
      return data || [];
    },
  });

import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Video,
  MessageCircle,
  Send,
  ArrowLeft,
  Search,
  Plus,
  User,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import {
  useMyChats,
  useChatMessages,
  useSendMessage,
  useStartChat,
  useRealtimeMessages,
  useSearchUsers,
} from "@/hooks/useChat";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const Chat = () => {
  const { user } = useAuth();
  const { data: chats, isLoading: chatsLoading } = useMyChats(user?.id);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: searchResults } = useSearchUsers(searchQuery);
  const startChat = useStartChat();

  const handleStartChat = async (otherUserId: string) => {
    try {
      const chatId = await startChat.mutateAsync(otherUserId);
      setActiveChatId(chatId);
      setShowNewChat(false);
      setSearchQuery("");
    } catch {
      toast.error("Failed to start chat");
    }
  };

  // On mobile, show either list or thread
  const showThread = !!activeChatId;
  const activeChat = chats?.find((c) => c.id === activeChatId);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Nav */}
      <nav className="border-b border-border bg-card/80 backdrop-blur-lg shrink-0">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Video className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-lg text-foreground">
              CallGuru
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex overflow-hidden">
        {/* Chat list — hidden on mobile when thread is open */}
        <div
          className={cn(
            "w-full md:w-80 border-r border-border bg-card flex flex-col shrink-0",
            showThread ? "hidden md:flex" : "flex"
          )}
        >
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold text-foreground">
              Messages
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowNewChat(!showNewChat)}
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>

          {/* New chat search */}
          {showNewChat && (
            <div className="p-3 border-b border-border space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>
              {searchResults
                ?.filter((u) => u.user_id !== user?.id)
                .map((u) => (
                  <button
                    key={u.user_id}
                    onClick={() => handleStartChat(u.user_id)}
                    className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-secondary transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">
                        {(u.full_name || "U")[0].toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {u.full_name || "User"}
                    </span>
                    {u.is_verified && (
                      <CheckCircle className="w-3.5 h-3.5 text-primary" />
                    )}
                  </button>
                ))}
            </div>
          )}

          {/* Chat list */}
          <div className="flex-1 overflow-y-auto">
            {chatsLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : chats?.length === 0 ? (
              <div className="text-center py-12 px-4">
                <MessageCircle className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No chats yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Click + to start a conversation
                </p>
              </div>
            ) : (
              chats?.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => setActiveChatId(chat.id)}
                  className={cn(
                    "flex items-center gap-3 w-full p-4 border-b border-border text-left transition-colors",
                    activeChatId === chat.id
                      ? "bg-primary/5"
                      : "hover:bg-secondary/50"
                  )}
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary">
                      {(chat.other_user?.full_name || "U")[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {chat.other_user?.full_name || "User"}
                      </p>
                      {chat.last_message_at && (
                        <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                          {formatDistanceToNow(new Date(chat.last_message_at), {
                            addSuffix: true,
                          })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {chat.last_message_text || "No messages yet"}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Message thread */}
        <div
          className={cn(
            "flex-1 flex flex-col",
            !showThread ? "hidden md:flex" : "flex"
          )}
        >
          {activeChatId ? (
            <MessageThread
              chatId={activeChatId}
              otherUser={activeChat?.other_user || null}
              userId={user?.id || ""}
              onBack={() => setActiveChatId(null)}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  Select a chat to start messaging
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface MessageThreadProps {
  chatId: string;
  otherUser: {
    full_name: string | null;
    avatar_url: string | null;
    is_verified: boolean | null;
  } | null;
  userId: string;
  onBack: () => void;
}

const MessageThread = ({
  chatId,
  otherUser,
  userId,
  onBack,
}: MessageThreadProps) => {
  const { data: messages, isLoading } = useChatMessages(chatId);
  const sendMessage = useSendMessage();
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Subscribe to realtime
  useRealtimeMessages(chatId);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim()) return;
    const msg = text.trim();
    setText("");
    try {
      await sendMessage.mutateAsync({ chatId, content: msg });
    } catch {
      toast.error("Failed to send message");
      setText(msg);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="h-14 border-b border-border bg-card flex items-center gap-3 px-4 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onBack}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-xs font-bold text-primary">
            {(otherUser?.full_name || "U")[0].toUpperCase()}
          </span>
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            {otherUser?.full_name || "User"}
            {otherUser?.is_verified && (
              <span className="ml-1 text-primary text-xs">✓</span>
            )}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages?.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-8">
            No messages yet — say hello!
          </p>
        ) : (
          messages?.map((msg) => {
            const isMine = msg.sender_id === userId;
            return (
              <div
                key={msg.id}
                className={cn(
                  "flex",
                  isMine ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-2.5",
                    isMine
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-secondary text-secondary-foreground rounded-bl-md"
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <p
                    className={cn(
                      "text-[10px] mt-1",
                      isMine
                        ? "text-primary-foreground/60"
                        : "text-muted-foreground"
                    )}
                  >
                    {formatDistanceToNow(new Date(msg.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border bg-card p-3 shrink-0">
        <div className="flex items-center gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          />
          <Button
            variant="hero"
            size="icon"
            onClick={handleSend}
            disabled={!text.trim() || sendMessage.isPending}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </>
  );
};

export default Chat;

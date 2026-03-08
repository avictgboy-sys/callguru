import { useState } from "react";
import { Bell, Heart, MessageCircle, UserPlus, MessageSquare, Check, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications, useUnreadCount, useMarkAllRead, useMarkOneRead, useRealtimeNotifications } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";

const typeIcons: Record<string, typeof Heart> = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  message: MessageSquare,
  payment: CreditCard,
};

const typeLinks: Record<string, (resourceId: string | null) => string> = {
  like: () => "/feed",
  comment: () => "/feed",
  follow: (id) => id ? `/profile/${id}` : "/feed",
  message: () => "/chat",
  payment: () => "/wallet",
};

const NotificationBell = () => {
  useRealtimeNotifications();
  const { data: notifications, isLoading } = useNotifications();
  const unreadCount = useUnreadCount();
  const markAllRead = useMarkAllRead();
  const markOneRead = useMarkOneRead();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-heading font-semibold text-sm text-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
            >
              <Check className="w-3 h-3 mr-1" /> Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading…</p>
          ) : !notifications?.length ? (
            <p className="text-sm text-muted-foreground text-center py-8">No notifications yet</p>
          ) : (
            <div>
              {notifications.map((n) => {
                const Icon = typeIcons[n.type] || Bell;
                const linkFn = typeLinks[n.type];
                const href = linkFn ? linkFn(n.resource_id) : "/feed";

                return (
                  <Link
                    key={n.id}
                    to={href}
                    onClick={() => {
                      if (!n.is_read) markOneRead.mutate(n.id);
                      setOpen(false);
                    }}
                    className={`flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border last:border-0 ${
                      !n.is_read ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      !n.is_read ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-tight ${!n.is_read ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                        {n.title}
                      </p>
                      {n.body && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{n.body}</p>
                      )}
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {!n.is_read && (
                      <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;

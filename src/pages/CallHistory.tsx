import { useAuth } from "@/contexts/AuthContext";
import { useCalls } from "@/hooks/useCalls";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Phone, PhoneIncoming, PhoneMissed, PhoneOff, Clock, Banknote } from "lucide-react";
import FileDisputeDialog from "@/components/disputes/FileDisputeDialog";
import { format } from "date-fns";

const CallHistory = () => {
  const { user } = useAuth();
  const { data: calls, isLoading } = useCalls();

  const userIds = calls
    ? [...new Set(calls.flatMap((c) => [c.caller_id, c.provider_id]))]
    : [];

  const { data: profiles } = useQuery({
    queryKey: ["call-profiles", userIds],
    enabled: userIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles_public")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);
      if (error) throw error;
      return Object.fromEntries(data.map((p) => [p.user_id, p]));
    },
  });

  const { data: services } = useQuery({
    queryKey: ["call-services", calls?.map((c) => c.service_id)],
    enabled: !!calls && calls.length > 0,
    queryFn: async () => {
      const ids = [...new Set(calls!.map((c) => c.service_id))];
      const { data, error } = await supabase
        .from("services")
        .select("id, title")
        .in("id", ids);
      if (error) throw error;
      return Object.fromEntries(data.map((s) => [s.id, s.title]));
    },
  });

  const getOtherParty = (call: (typeof calls)[0]) => {
    const otherId = call.caller_id === user?.id ? call.provider_id : call.caller_id;
    return profiles?.[otherId];
  };

  const getRole = (call: (typeof calls)[0]) =>
    call.caller_id === user?.id ? "Caller" : "Provider";

  // Get call type label and icon based on status and role
  const getCallType = (call: (typeof calls)[0]) => {
    const role = getRole(call);
    const status = call.status;

    if (status === "completed") {
      return {
        label: role === "Caller" ? "আউটগোয়িং" : "রিসিভড",
        icon: role === "Caller" ? <Phone className="w-3.5 h-3.5" /> : <PhoneIncoming className="w-3.5 h-3.5" />,
        color: "default" as const,
      };
    }
    if (status === "missed") {
      return {
        label: "মিসড কল",
        icon: <PhoneMissed className="w-3.5 h-3.5" />,
        color: "destructive" as const,
      };
    }
    if (status === "declined") {
      return {
        label: role === "Provider" ? "ডিক্লাইনড" : "প্রত্যাখ্যাত",
        icon: <PhoneOff className="w-3.5 h-3.5" />,
        color: "destructive" as const,
      };
    }
    if (status === "active") {
      return {
        label: "চলছে",
        icon: <Phone className="w-3.5 h-3.5" />,
        color: "secondary" as const,
      };
    }
    return {
      label: status,
      icon: <Phone className="w-3.5 h-3.5" />,
      color: "destructive" as const,
    };
  };

  const completed = calls?.filter((c) => c.status === "completed") ?? [];
  const missed = calls?.filter((c) => c.status === "missed") ?? [];
  const totalSpent = completed
    .filter((c) => c.caller_id === user?.id)
    .reduce((s, c) => s + (c.total_cost ?? 0), 0);
  const totalEarned = completed
    .filter((c) => c.provider_id === user?.id)
    .reduce((s, c) => s + (c.provider_earning ?? 0), 0);
  const totalMinutes = completed.reduce((s, c) => s + (c.duration_minutes ?? 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card">
        <div className="flex items-center h-14 px-4 gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <h1 className="font-heading text-lg font-bold text-foreground">কল হিস্ট্রি</h1>
        </div>
      </nav>

      <div className="px-4 py-6 max-w-3xl mx-auto space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-2">
          <Card>
            <CardContent className="flex flex-col items-center p-3">
              <Phone className="w-4 h-4 text-primary mb-1" />
              <p className="text-[10px] text-muted-foreground">সেশন</p>
              <p className="font-heading text-base font-bold text-foreground">{completed.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center p-3">
              <PhoneMissed className="w-4 h-4 text-destructive mb-1" />
              <p className="text-[10px] text-muted-foreground">মিসড</p>
              <p className="font-heading text-base font-bold text-foreground">{missed.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center p-3">
              <Clock className="w-4 h-4 text-primary mb-1" />
              <p className="text-[10px] text-muted-foreground">মিনিট</p>
              <p className="font-heading text-base font-bold text-foreground">{totalMinutes.toFixed(0)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center p-3">
              <Banknote className="w-4 h-4 text-primary mb-1" />
              <p className="text-[10px] text-muted-foreground">খরচ/আয়</p>
              <p className="font-heading text-[10px] font-bold text-foreground">
                ৳{totalSpent.toFixed(0)}/৳{totalEarned.toFixed(0)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Call Cards */}
        {isLoading ? (
          <p className="text-muted-foreground text-center py-8">Loading…</p>
        ) : !calls || calls.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">কোনো কল হিস্ট্রি নেই।</p>
        ) : (
          <div className="space-y-3">
            {calls.map((call) => {
              const other = getOtherParty(call);
              const role = getRole(call);
              const callType = getCallType(call);
              return (
                <Card key={call.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Link to={`/profile/${role === "Caller" ? call.provider_id : call.caller_id}`}>
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={other?.avatar_url ?? ""} />
                          <AvatarFallback className="text-sm">{other?.full_name?.[0] ?? "?"}</AvatarFallback>
                        </Avatar>
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {other?.full_name || "Unknown"}
                          </p>
                          <Badge variant={callType.color} className="text-[10px] shrink-0 flex items-center gap-1">
                            {callType.icon}
                            {callType.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {services?.[call.service_id] ?? "—"} · {role === "Caller" ? "কলার" : "প্রোভাইডার"}
                        </p>
                        {call.status === "completed" && (
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                            <span>{call.duration_minutes != null ? `${call.duration_minutes} min` : "—"}</span>
                            <span>৳{call.price_per_minute}/min</span>
                            <span className="font-medium text-foreground">Total: ৳{call.total_cost?.toFixed(2) ?? "—"}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[11px] text-muted-foreground">
                            {format(new Date(call.created_at), "MMM d, HH:mm")}
                          </span>
                          {call.status === "completed" && (
                            <FileDisputeDialog
                              callId={call.id}
                              againstId={call.caller_id === user?.id ? call.provider_id : call.caller_id}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CallHistory;

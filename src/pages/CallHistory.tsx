import { useAuth } from "@/contexts/AuthContext";
import { useCalls } from "@/hooks/useCalls";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Phone, Clock, Banknote } from "lucide-react";
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
        .from("profiles")
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

  const statusColor = (s: string) => {
    if (s === "completed") return "default";
    if (s === "active") return "secondary";
    return "destructive";
  };

  const completed = calls?.filter((c) => c.status === "completed") ?? [];
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
          <h1 className="font-heading text-lg font-bold text-foreground">Call History</h1>
        </div>
      </nav>

      <div className="px-4 py-6 max-w-3xl mx-auto space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="flex flex-col items-center p-4">
              <Phone className="w-5 h-5 text-primary mb-1" />
              <p className="text-xs text-muted-foreground">Sessions</p>
              <p className="font-heading text-lg font-bold text-foreground">{completed.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center p-4">
              <Clock className="w-5 h-5 text-primary mb-1" />
              <p className="text-xs text-muted-foreground">Minutes</p>
              <p className="font-heading text-lg font-bold text-foreground">{totalMinutes.toFixed(0)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center p-4">
              <Banknote className="w-5 h-5 text-primary mb-1" />
              <p className="text-xs text-muted-foreground">Spent/Earned</p>
              <p className="font-heading text-xs font-bold text-foreground">
                ৳{totalSpent.toFixed(0)}/৳{totalEarned.toFixed(0)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Call Cards - Mobile friendly */}
        {isLoading ? (
          <p className="text-muted-foreground text-center py-8">Loading…</p>
        ) : !calls || calls.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No call history yet.</p>
        ) : (
          <div className="space-y-3">
            {calls.map((call) => {
              const other = getOtherParty(call);
              const role = getRole(call);
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
                          <Badge variant={statusColor(call.status)} className="text-[10px] capitalize shrink-0">
                            {call.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {services?.[call.service_id] ?? "—"} · {role}
                        </p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                          <span>{call.duration_minutes != null ? `${call.duration_minutes} min` : "—"}</span>
                          <span>৳{call.price_per_minute}/min</span>
                          <span className="font-medium text-foreground">Total: ৳{call.total_cost?.toFixed(2) ?? "—"}</span>
                        </div>
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

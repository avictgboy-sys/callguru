import { useAuth } from "@/contexts/AuthContext";
import { useCalls } from "@/hooks/useCalls";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Phone, Clock, Banknote, AlertTriangle } from "lucide-react";
import FileDisputeDialog from "@/components/disputes/FileDisputeDialog";
import { format } from "date-fns";

const CallHistory = () => {
  const { user } = useAuth();
  const { data: calls, isLoading } = useCalls();

  // Fetch profiles for all unique caller/provider IDs
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

  // Summary stats
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
        <div className="container mx-auto flex items-center h-16 px-4 gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <h1 className="font-heading text-xl font-bold text-foreground">Call History</h1>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="flex items-center gap-3 p-5">
              <Phone className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Sessions</p>
                <p className="font-heading text-2xl font-bold text-foreground">{completed.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-5">
              <Clock className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Minutes</p>
                <p className="font-heading text-2xl font-bold text-foreground">{totalMinutes.toFixed(1)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-5">
              <Banknote className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Spent / Earned</p>
                <p className="font-heading text-lg font-bold text-foreground">
                  ৳{totalSpent.toFixed(2)} / ৳{totalEarned.toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground text-center py-8">Loading…</p>
            ) : !calls || calls.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No call history yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>With</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Fee</TableHead>
                    <TableHead>Net</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calls.map((call) => {
                    const other = getOtherParty(call);
                    const role = getRole(call);
                    return (
                      <TableRow key={call.id}>
                        <TableCell>
                          <Link to={`/profile/${role === "Caller" ? call.provider_id : call.caller_id}`} className="flex items-center gap-2 hover:underline">
                            <Avatar className="h-7 w-7">
                              <AvatarImage src={other?.avatar_url ?? ""} />
                              <AvatarFallback className="text-xs">{other?.full_name?.[0] ?? "?"}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium truncate max-w-[120px]">{other?.full_name || "Unknown"}</span>
                          </Link>
                        </TableCell>
                        <TableCell className="text-sm truncate max-w-[140px]">{services?.[call.service_id] ?? "—"}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{role}</Badge></TableCell>
                        <TableCell className="text-sm">{call.duration_minutes != null ? `${call.duration_minutes} min` : "—"}</TableCell>
                        <TableCell className="text-sm">৳{call.price_per_minute}/min</TableCell>
                        <TableCell className="text-sm font-medium">৳{call.total_cost?.toFixed(2) ?? "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">৳{call.platform_fee?.toFixed(2) ?? "—"}</TableCell>
                        <TableCell className="text-sm font-medium">৳{call.provider_earning?.toFixed(2) ?? "—"}</TableCell>
                        <TableCell><Badge variant={statusColor(call.status)} className="text-xs capitalize">{call.status}</Badge></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{format(new Date(call.created_at), "MMM d, HH:mm")}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CallHistory;

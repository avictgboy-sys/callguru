import AdminLayout from "@/components/admin/AdminLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Video, Clock, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const AdminRecordings = () => {
  const { data: calls, isLoading } = useQuery({
    queryKey: ["admin-recordings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("calls")
        .select("*")
        .not("recording_url", "is", null)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  // Fetch profiles for display
  const userIds = calls
    ? [...new Set(calls.flatMap((c) => [c.caller_id, c.provider_id]))]
    : [];

  const { data: profiles } = useQuery({
    queryKey: ["admin-rec-profiles", userIds],
    enabled: userIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);
      if (error) throw error;
      return Object.fromEntries(data.map((p) => [p.user_id, p.full_name || "Unknown"]));
    },
  });

  const handleDownload = async (recordingPath: string, callId: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("call-recordings")
        .createSignedUrl(recordingPath, 3600); // 1 hour expiry

      if (error) throw error;
      window.open(data.signedUrl, "_blank");
    } catch (e: any) {
      toast.error("Failed to get recording: " + (e.message || ""));
    }
  };

  const totalRecordings = calls?.length || 0;
  const recentCount = calls?.filter(
    (c) => new Date(c.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  ).length || 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Call Recordings</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Recordings are kept for 90 days for dispute resolution. Auto-deleted after expiry.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="flex items-center gap-3 p-5">
              <Video className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Recordings</p>
                <p className="font-heading text-2xl font-bold text-foreground">{totalRecordings}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-5">
              <Clock className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="font-heading text-2xl font-bold text-foreground">{recentCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-5">
              <AlertTriangle className="w-8 h-8 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Retention</p>
                <p className="font-heading text-2xl font-bold text-foreground">90 days</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recorded Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground text-center py-8">Loading…</p>
            ) : !calls || calls.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No recordings yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Caller</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calls.map((call) => (
                    <TableRow key={call.id}>
                      <TableCell className="text-sm">
                        {format(new Date(call.created_at), "MMM d, yyyy HH:mm")}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {profiles?.[call.caller_id] || "—"}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {profiles?.[call.provider_id] || "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {call.duration_minutes != null ? `${call.duration_minutes} min` : "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        ৳{call.total_cost?.toFixed(2) ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="default" className="text-xs capitalize">{call.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(call.recording_url!, call.id)}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminRecordings;

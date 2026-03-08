import AdminLayout from "@/components/admin/AdminLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle, CheckCircle, XCircle, Video, Eye } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useState } from "react";

const AdminDisputes = () => {
  const queryClient = useQueryClient();
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [adminNote, setAdminNote] = useState("");
  const [resolveAction, setResolveAction] = useState<"resolved" | "rejected" | null>(null);

  const { data: disputes, isLoading } = useQuery({
    queryKey: ["admin-disputes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("disputes" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as any[];
    },
  });

  // Get all user IDs and call IDs
  const userIds = disputes
    ? [...new Set(disputes.flatMap((d: any) => [d.complainant_id, d.against_id]))]
    : [];
  const callIds = disputes ? [...new Set(disputes.map((d: any) => d.call_id))] : [];

  const { data: profiles } = useQuery({
    queryKey: ["admin-dispute-profiles", userIds],
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

  const { data: calls } = useQuery({
    queryKey: ["admin-dispute-calls", callIds],
    enabled: callIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("calls")
        .select("id, recording_url, duration_minutes, total_cost, created_at")
        .in("id", callIds);
      if (error) throw error;
      return Object.fromEntries(data.map((c) => [c.id, c]));
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async ({ disputeId, status, note }: { disputeId: string; status: string; note: string }) => {
      const { error } = await supabase
        .from("disputes" as any)
        .update({
          status,
          admin_note: note || null,
          resolved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", disputeId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-disputes"] });
      toast.success("Dispute updated");
      setSelectedDispute(null);
      setAdminNote("");
      setResolveAction(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleViewRecording = async (recordingPath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("call-recordings")
        .createSignedUrl(recordingPath, 3600);
      if (error) throw error;
      window.open(data.signedUrl, "_blank");
    } catch (e: any) {
      toast.error("Failed to get recording: " + (e.message || ""));
    }
  };

  const statusBadge = (s: string) => {
    if (s === "open") return <Badge variant="destructive" className="text-xs">Open</Badge>;
    if (s === "resolved") return <Badge variant="default" className="text-xs">Resolved</Badge>;
    return <Badge variant="secondary" className="text-xs capitalize">{s}</Badge>;
  };

  const openCount = disputes?.filter((d: any) => d.status === "open").length || 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Disputes</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Review user complaints. Watch call recordings to make fair decisions.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="flex items-center gap-3 p-5">
              <AlertTriangle className="w-8 h-8 text-destructive" />
              <div>
                <p className="text-sm text-muted-foreground">Open Disputes</p>
                <p className="font-heading text-2xl font-bold text-foreground">{openCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-5">
              <CheckCircle className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Disputes</p>
                <p className="font-heading text-2xl font-bold text-foreground">{disputes?.length || 0}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">All Disputes</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground text-center py-8">Loading…</p>
            ) : !disputes || disputes.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No disputes yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table className="min-w-[860px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Complainant</TableHead>
                      <TableHead>Against</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Recording</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {disputes.map((d: any) => {
                      const call = calls?.[d.call_id];
                      return (
                        <TableRow key={d.id}>
                          <TableCell className="text-sm">
                            {format(new Date(d.created_at), "MMM d, yyyy HH:mm")}
                          </TableCell>
                          <TableCell className="text-sm font-medium">
                            {profiles?.[d.complainant_id] || "—"}
                          </TableCell>
                          <TableCell className="text-sm font-medium">
                            {profiles?.[d.against_id] || "—"}
                          </TableCell>
                          <TableCell className="text-sm max-w-[200px] truncate">{d.reason}</TableCell>
                          <TableCell>{statusBadge(d.status)}</TableCell>
                          <TableCell>
                            {call?.recording_url ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewRecording(call.recording_url!)}
                              >
                                <Video className="w-4 h-4 mr-1" />
                                Watch
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">No recording</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedDispute(d);
                                setAdminNote(d.admin_note || "");
                              }}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Review
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Review Dialog */}
      <Dialog open={!!selectedDispute} onOpenChange={(o) => !o && setSelectedDispute(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Dispute</DialogTitle>
          </DialogHeader>
          {selectedDispute && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Complainant</p>
                  <p className="font-medium">{profiles?.[selectedDispute.complainant_id] || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Against</p>
                  <p className="font-medium">{profiles?.[selectedDispute.against_id] || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Reason</p>
                  <p className="font-medium">{selectedDispute.reason}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  {statusBadge(selectedDispute.status)}
                </div>
              </div>

              {selectedDispute.details && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Details</p>
                  <p className="text-sm bg-muted p-3 rounded-lg">{selectedDispute.details}</p>
                </div>
              )}

              {calls?.[selectedDispute.call_id]?.recording_url && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleViewRecording(calls[selectedDispute.call_id].recording_url!)}
                >
                  <Video className="w-4 h-4 mr-2" />
                  Watch Call Recording
                </Button>
              )}

              {selectedDispute.status === "open" && (
                <>
                  <div className="space-y-2">
                    <Label>Admin Note</Label>
                    <Textarea
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="Add resolution notes..."
                      rows={3}
                      maxLength={500}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={() =>
                        resolveMutation.mutate({
                          disputeId: selectedDispute.id,
                          status: "resolved",
                          note: adminNote,
                        })
                      }
                      disabled={resolveMutation.isPending}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Resolve
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() =>
                        resolveMutation.mutate({
                          disputeId: selectedDispute.id,
                          status: "rejected",
                          note: adminNote,
                        })
                      }
                      disabled={resolveMutation.isPending}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </>
              )}

              {selectedDispute.admin_note && selectedDispute.status !== "open" && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Admin Note</p>
                  <p className="text-sm bg-muted p-3 rounded-lg">{selectedDispute.admin_note}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminDisputes;

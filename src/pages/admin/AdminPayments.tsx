import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2, XCircle, Clock, Search, CreditCard,
  ArrowDownLeft, ArrowUpRight, Eye,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { PAYMENT_METHODS } from "@/hooks/usePayment";

const useAdminPaymentRequests = (filter: string) => {
  return useQuery({
    queryKey: ["admin-payment-requests", filter],
    queryFn: async () => {
      let query = supabase
        .from("payment_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (filter !== "all") {
        query = query.eq("status", filter);
      }
      const { data, error } = await query;
      if (error) throw error;
      // Fetch profile names
      const userIds = [...new Set((data || []).map((r: any) => r.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);
      const nameMap: Record<string, string> = {};
      (profiles || []).forEach((p: any) => { nameMap[p.user_id] = p.full_name || "Unknown"; });
      return (data || []).map((r: any) => ({ ...r, user_name: nameMap[r.user_id] || "Unknown" }));
    },
  });
};

const useApprovePayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, note }: { id: string; note?: string }) => {
      const { error } = await supabase.rpc("approve_payment_request", {
        p_request_id: id,
        p_admin_note: note || null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-payment-requests"] }),
  });
};

const useRejectPayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, note }: { id: string; note?: string }) => {
      const { error } = await supabase.rpc("reject_payment_request", {
        p_request_id: id,
        p_admin_note: note || null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-payment-requests"] }),
  });
};

const statusBadge = (status: string) => {
  switch (status) {
    case "pending": return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Pending</Badge>;
    case "completed": return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Approved</Badge>;
    case "rejected": return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Rejected</Badge>;
    default: return <Badge variant="secondary">{status}</Badge>;
  }
};

const AdminPayments = () => {
  const [filter, setFilter] = useState("pending");
  const [search, setSearch] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [adminNote, setAdminNote] = useState("");
  const { data: requests, isLoading } = useAdminPaymentRequests(filter);
  const approve = useApprovePayment();
  const reject = useRejectPayment();

  const filtered = (requests || []).filter(
    (r: any) =>
      (r.user_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.method || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.reference_id || "").toLowerCase().includes(search.toLowerCase())
  );

  const pendingCount = (requests || []).filter((r: any) => r.status === "pending").length;

  const handleApprove = async (id: string) => {
    try {
      await approve.mutateAsync({ id, note: adminNote });
      toast.success("Payment approved");
      setSelectedRequest(null);
      setAdminNote("");
    } catch (e: any) {
      toast.error(e.message || "Failed to approve");
    }
  };

  const handleReject = async (id: string) => {
    try {
      await reject.mutateAsync({ id, note: adminNote });
      toast.success("Payment rejected");
      setSelectedRequest(null);
      setAdminNote("");
    } catch (e: any) {
      toast.error(e.message || "Failed to reject");
    }
  };

  const filters = [
    { value: "pending", label: "Pending", icon: Clock },
    { value: "completed", label: "Approved", icon: CheckCircle2 },
    { value: "rejected", label: "Rejected", icon: XCircle },
    { value: "all", label: "All", icon: CreditCard },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">Payment Requests</h1>
            <p className="text-muted-foreground mt-1">
              {pendingCount > 0
                ? `${pendingCount} pending request${pendingCount > 1 ? "s" : ""} awaiting review`
                : "No pending requests"}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  filter === f.value
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <f.icon className="w-3.5 h-3.5" />
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, method, reference..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !filtered.length ? (
              <p className="text-muted-foreground text-sm text-center py-12">No payment requests found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">User</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Type</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Method</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Amount</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Reference</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Date</th>
                      <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((req: any) => {
                      const methodInfo = PAYMENT_METHODS.find((m) => m.id === req.method);
                      return (
                        <tr key={req.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-foreground">{req.user_name}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              {req.type === "topup"
                                ? <ArrowDownLeft className="w-3.5 h-3.5 text-green-500" />
                                : <ArrowUpRight className="w-3.5 h-3.5 text-red-500" />}
                              <span className="text-sm text-foreground capitalize">{req.type}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <span>{methodInfo?.icon || "💳"}</span>
                              <span className="text-sm text-foreground">{methodInfo?.name || req.method}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-foreground">৳{Number(req.amount).toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground font-mono">
                            {req.reference_id || "—"}
                          </td>
                          <td className="px-4 py-3">{statusBadge(req.status)}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {format(new Date(req.created_at), "MMM d, h:mm a")}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => { setSelectedRequest(req); setAdminNote(""); }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={(o) => !o && setSelectedRequest(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedRequest && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  Payment Request Details
                  {statusBadge(selectedRequest.status)}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">User</p>
                    <p className="font-medium text-foreground">{selectedRequest.user_name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Amount</p>
                    <p className="font-semibold text-foreground text-lg">${Number(selectedRequest.amount).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Type</p>
                    <p className="font-medium text-foreground capitalize">{selectedRequest.type}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Method</p>
                    <p className="font-medium text-foreground">
                      {PAYMENT_METHODS.find((m) => m.id === selectedRequest.method)?.icon}{" "}
                      {PAYMENT_METHODS.find((m) => m.id === selectedRequest.method)?.name || selectedRequest.method}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Reference ID</p>
                    <p className="font-mono text-foreground">{selectedRequest.reference_id || "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Date</p>
                    <p className="text-foreground">{format(new Date(selectedRequest.created_at), "MMM d, yyyy h:mm a")}</p>
                  </div>
                </div>

                {/* Bank details */}
                {selectedRequest.bank_details && (
                  <div className="rounded-lg bg-muted p-3 space-y-1">
                    <p className="text-xs font-semibold text-foreground mb-1">
                      {selectedRequest.type === "withdraw" ? "Recipient Details" : "Sender Details"}
                    </p>
                    {Object.entries(selectedRequest.bank_details).map(([key, val]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                        <span className="font-medium text-foreground">{val as string}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Existing admin note */}
                {selectedRequest.admin_note && (
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-xs font-semibold text-foreground mb-1">Admin Note</p>
                    <p className="text-sm text-muted-foreground">{selectedRequest.admin_note}</p>
                  </div>
                )}

                {/* Action area for pending requests */}
                {selectedRequest.status === "pending" && (
                  <div className="space-y-3 pt-2 border-t border-border">
                    <div>
                      <label className="text-sm font-medium text-foreground">Admin Note (optional)</label>
                      <Textarea
                        placeholder="Add a note..."
                        value={adminNote}
                        onChange={(e) => setAdminNote(e.target.value)}
                        rows={2}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        disabled={approve.isPending || reject.isPending}
                        onClick={() => handleApprove(selectedRequest.id)}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        {approve.isPending ? "Approving…" : "Approve"}
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1"
                        disabled={approve.isPending || reject.isPending}
                        onClick={() => handleReject(selectedRequest.id)}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        {reject.isPending ? "Rejecting…" : "Reject"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminPayments;

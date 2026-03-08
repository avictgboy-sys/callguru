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
import { CheckCircle, XCircle, Eye, Megaphone, Clock, Image } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useState } from "react";

const AdminAds = () => {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<any>(null);
  const [adminNote, setAdminNote] = useState("");

  const { data: ads, isLoading } = useQuery({
    queryKey: ["admin-self-ads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("self_ads" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const userIds = ads ? [...new Set(ads.map((a: any) => a.user_id))] : [];
  const { data: profiles } = useQuery({
    queryKey: ["admin-ad-profiles", userIds],
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

  const updateAd = useMutation({
    mutationFn: async ({ adId, status, note }: { adId: string; status: string; note: string }) => {
      const { error } = await supabase
        .from("self_ads" as any)
        .update({
          status,
          admin_note: note || null,
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", adId);
      if (error) throw error;

      // If rejecting, refund the budget
      if (status === "rejected") {
        const ad = ads?.find((a: any) => a.id === adId);
        if (ad) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("wallet_balance")
            .eq("user_id", ad.user_id)
            .single();
          if (profile) {
            await supabase
              .from("profiles")
              .update({ wallet_balance: (profile.wallet_balance || 0) + ad.budget })
              .eq("user_id", ad.user_id);
            await supabase.from("wallet_transactions").insert({
              user_id: ad.user_id,
              type: "topup",
              amount: ad.budget,
              description: `Ad refund: ${ad.title}`,
            });
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-self-ads"] });
      toast.success("Ad updated");
      setSelected(null);
      setAdminNote("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const statusBadge = (s: string) => {
    const map: Record<string, "default" | "secondary" | "destructive"> = {
      pending: "secondary",
      active: "default",
      rejected: "destructive",
      completed: "default",
      paused: "secondary",
    };
    return <Badge variant={map[s] || "secondary"} className="text-xs capitalize">{s}</Badge>;
  };

  const pendingCount = ads?.filter((a: any) => a.status === "pending").length || 0;
  const totalRevenue = ads?.filter((a: any) => a.status !== "rejected").reduce((s: number, a: any) => s + (a.budget || 0), 0) || 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Self-Serve Ads</h1>
          <p className="text-muted-foreground text-sm mt-1">Review and approve user-created advertisements</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="flex items-center gap-3 p-5">
              <Clock className="w-8 h-8 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="font-heading text-2xl font-bold text-foreground">{pendingCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-5">
              <Megaphone className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Ads</p>
                <p className="font-heading text-2xl font-bold text-foreground">{ads?.length || 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-5">
              <CheckCircle className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Ad Revenue</p>
                <p className="font-heading text-2xl font-bold text-foreground">৳{totalRevenue.toFixed(0)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">All Ads</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground text-center py-8">Loading…</p>
            ) : !ads || ads.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No ads yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Advertiser</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Impressions</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ads.map((ad: any) => (
                    <TableRow key={ad.id}>
                      <TableCell className="text-sm">
                        {format(new Date(ad.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {profiles?.[ad.user_id] || "—"}
                      </TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">{ad.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs capitalize">{ad.ad_type}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">৳{ad.budget}</TableCell>
                      <TableCell className="text-sm">{ad.impressions}</TableCell>
                      <TableCell>{statusBadge(ad.status)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => { setSelected(ad); setAdminNote(ad.admin_note || ""); }}>
                          <Eye className="w-4 h-4 mr-1" /> Review
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

      {/* Review Dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Ad</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Advertiser</p>
                  <p className="font-medium">{profiles?.[selected.user_id] || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Type</p>
                  <Badge variant="outline" className="capitalize">{selected.ad_type}</Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Budget</p>
                  <p className="font-medium">৳{selected.budget}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  {statusBadge(selected.status)}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-foreground">{selected.title}</p>
                {selected.description && (
                  <p className="text-sm text-muted-foreground mt-1">{selected.description}</p>
                )}
              </div>

              {selected.image_url && (
                <img src={selected.image_url} alt="Ad preview" className="w-full rounded-lg max-h-48 object-cover" />
              )}

              {selected.video_url && (
                <video src={selected.video_url} controls className="w-full rounded-lg max-h-48" />
              )}

              {selected.link_url && (
                <a href={selected.link_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline">
                  {selected.link_url}
                </a>
              )}

              {selected.status === "pending" && (
                <>
                  <div className="space-y-2">
                    <Label>Admin Note</Label>
                    <Textarea
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="Optional note..."
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={() => updateAd.mutate({ adId: selected.id, status: "active", note: adminNote })}
                      disabled={updateAd.isPending}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" /> Approve
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => updateAd.mutate({ adId: selected.id, status: "rejected", note: adminNote })}
                      disabled={updateAd.isPending}
                    >
                      <XCircle className="w-4 h-4 mr-1" /> Reject & Refund
                    </Button>
                  </div>
                </>
              )}

              {selected.status === "active" && (
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => updateAd.mutate({ adId: selected.id, status: "paused", note: adminNote })}
                  disabled={updateAd.isPending}
                >
                  Pause Ad
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminAds;

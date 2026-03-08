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
import { CheckCircle, XCircle, Eye, Megaphone, Clock, TrendingUp, DollarSign, MousePointerClick, BarChart3, Pause, Play, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useState } from "react";

const AdminAds = () => {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<any>(null);
  const [adminNote, setAdminNote] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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
      toast.success("Ad updated successfully");
      setSelected(null);
      setAdminNote("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: any; color: string }> = {
    pending: { variant: "secondary", icon: Clock, color: "text-yellow-500" },
    active: { variant: "default", icon: Play, color: "text-green-500" },
    rejected: { variant: "destructive", icon: XCircle, color: "text-destructive" },
    completed: { variant: "outline", icon: CheckCircle, color: "text-muted-foreground" },
    paused: { variant: "secondary", icon: Pause, color: "text-orange-500" },
  };

  const statusBadge = (s: string) => {
    const cfg = statusConfig[s] || statusConfig.pending;
    const Icon = cfg.icon;
    return (
      <Badge variant={cfg.variant} className="text-xs capitalize gap-1">
        <Icon className="w-3 h-3" />
        {s}
      </Badge>
    );
  };

  const pendingCount = ads?.filter((a: any) => a.status === "pending").length || 0;
  const activeCount = ads?.filter((a: any) => a.status === "active").length || 0;
  const totalRevenue = ads?.filter((a: any) => a.status !== "rejected").reduce((s: number, a: any) => s + (a.budget || 0), 0) || 0;
  const totalClicks = ads?.reduce((s: number, a: any) => s + (a.clicks || 0), 0) || 0;
  const totalImpressions = ads?.reduce((s: number, a: any) => s + (a.impressions || 0), 0) || 0;

  const filteredAds = statusFilter === "all" ? ads : ads?.filter((a: any) => a.status === statusFilter);

  const statuses = ["all", "pending", "active", "paused", "rejected", "completed"];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
              <Megaphone className="w-7 h-7 text-primary" />
              বিজ্ঞাপন ম্যানেজমেন্ট
            </h1>
            <p className="text-muted-foreground text-sm mt-1">সেলফ-সার্ভ বিজ্ঞাপন রিভিউ ও অ্যাপ্রুভ করুন</p>
          </div>
          {pendingCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
              <Clock className="w-5 h-5 text-yellow-500" />
              <span className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                {pendingCount}টি পেন্ডিং রিভিউ
              </span>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Megaphone className="w-4 h-4 text-primary" />
                </div>
              </div>
              <p className="font-heading text-2xl font-bold text-foreground">{ads?.length || 0}</p>
              <p className="text-xs text-muted-foreground">মোট বিজ্ঞাপন</p>
            </CardContent>
          </Card>
          <Card className="border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-transparent">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-yellow-500" />
                </div>
              </div>
              <p className="font-heading text-2xl font-bold text-foreground">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">পেন্ডিং</p>
            </CardContent>
          </Card>
          <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Play className="w-4 h-4 text-green-500" />
                </div>
              </div>
              <p className="font-heading text-2xl font-bold text-foreground">{activeCount}</p>
              <p className="text-xs text-muted-foreground">অ্যাক্টিভ</p>
            </CardContent>
          </Card>
          <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-transparent">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-accent" />
                </div>
              </div>
              <p className="font-heading text-2xl font-bold text-foreground">৳{totalRevenue.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">মোট আয়</p>
            </CardContent>
          </Card>
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MousePointerClick className="w-4 h-4 text-primary" />
                </div>
              </div>
              <p className="font-heading text-2xl font-bold text-foreground">{totalClicks.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">মোট ক্লিক</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                statusFilter === s
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-primary/50"
              }`}
            >
              {s === "all" ? "সব" : s === "pending" ? "পেন্ডিং" : s === "active" ? "অ্যাক্টিভ" : s === "paused" ? "পজড" : s === "rejected" ? "রিজেক্টেড" : "সম্পন্ন"}
              {s === "pending" && pendingCount > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded-full bg-yellow-500 text-white">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Ads Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              বিজ্ঞাপন তালিকা
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !filteredAds || filteredAds.length === 0 ? (
              <div className="text-center py-12">
                <Megaphone className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground font-medium">কোনো বিজ্ঞাপন নেই</p>
              </div>
            ) : (
              <>
                {/* Mobile card view */}
                <div className="md:hidden space-y-3">
                  {filteredAds.map((ad: any) => (
                    <div
                      key={ad.id}
                      className="p-4 rounded-xl border border-border bg-card hover:shadow-sm transition-shadow"
                      onClick={() => { setSelected(ad); setAdminNote(ad.admin_note || ""); }}
                    >
                      <div className="flex items-start gap-3">
                        {ad.image_url ? (
                          <img src={ad.image_url} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
                            <ImageIcon className="w-6 h-6 text-primary/30" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-foreground truncate">{ad.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {profiles?.[ad.user_id] || "—"} · {format(new Date(ad.created_at), "MMM d")}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            {statusBadge(ad.status)}
                            <span className="text-xs text-muted-foreground">৳{ad.budget}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {ad.impressions}</span>
                        <span className="flex items-center gap-1"><MousePointerClick className="w-3 h-3" /> {ad.clicks}</span>
                        <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> ৳{ad.spent || 0}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[60px]">ছবি</TableHead>
                        <TableHead>তারিখ</TableHead>
                        <TableHead>বিজ্ঞাপনদাতা</TableHead>
                        <TableHead>শিরোনাম</TableHead>
                        <TableHead>টাইপ</TableHead>
                        <TableHead>বাজেট</TableHead>
                        <TableHead>ইম্প্রেশন</TableHead>
                        <TableHead>ক্লিক</TableHead>
                        <TableHead>খরচ</TableHead>
                        <TableHead>স্ট্যাটাস</TableHead>
                        <TableHead>অ্যাকশন</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAds.map((ad: any) => (
                        <TableRow key={ad.id} className="hover:bg-secondary/50 cursor-pointer" onClick={() => { setSelected(ad); setAdminNote(ad.admin_note || ""); }}>
                          <TableCell>
                            {ad.image_url ? (
                              <img src={ad.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center">
                                <ImageIcon className="w-4 h-4 text-primary/30" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            {format(new Date(ad.created_at), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell className="text-sm font-medium">
                            {profiles?.[ad.user_id] || "—"}
                          </TableCell>
                          <TableCell className="text-sm max-w-[180px] truncate">{ad.title}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs capitalize">{ad.ad_type}</Badge>
                          </TableCell>
                          <TableCell className="text-sm font-semibold">৳{ad.budget}</TableCell>
                          <TableCell className="text-sm">{ad.impressions.toLocaleString()}</TableCell>
                          <TableCell className="text-sm">{ad.clicks.toLocaleString()}</TableCell>
                          <TableCell className="text-sm">৳{(ad.spent || 0).toLocaleString()}</TableCell>
                          <TableCell>{statusBadge(ad.status)}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelected(ad); setAdminNote(ad.admin_note || ""); }}>
                              <Eye className="w-4 h-4 mr-1" /> রিভিউ
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Review Dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-primary" />
              বিজ্ঞাপন রিভিউ
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              {/* Preview image */}
              {selected.image_url && (
                <img src={selected.image_url} alt="Ad preview" className="w-full rounded-xl max-h-52 object-cover border border-border" />
              )}
              {selected.video_url && (
                <video src={selected.video_url} controls className="w-full rounded-xl max-h-52" />
              )}

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-secondary/50">
                  <p className="text-xs text-muted-foreground">বিজ্ঞাপনদাতা</p>
                  <p className="font-semibold text-sm text-foreground mt-0.5">{profiles?.[selected.user_id] || "—"}</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50">
                  <p className="text-xs text-muted-foreground">টাইপ</p>
                  <Badge variant="outline" className="capitalize mt-0.5">{selected.ad_type}</Badge>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50">
                  <p className="text-xs text-muted-foreground">বাজেট</p>
                  <p className="font-semibold text-sm text-foreground mt-0.5">৳{selected.budget}</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50">
                  <p className="text-xs text-muted-foreground">স্ট্যাটাস</p>
                  <div className="mt-0.5">{statusBadge(selected.status)}</div>
                </div>
              </div>

              {/* Performance stats */}
              <div className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50">
                <div className="text-center flex-1">
                  <p className="text-lg font-bold text-foreground">{selected.impressions?.toLocaleString() || 0}</p>
                  <p className="text-[10px] text-muted-foreground">ইম্প্রেশন</p>
                </div>
                <div className="w-px h-8 bg-border" />
                <div className="text-center flex-1">
                  <p className="text-lg font-bold text-foreground">{selected.clicks?.toLocaleString() || 0}</p>
                  <p className="text-[10px] text-muted-foreground">ক্লিক</p>
                </div>
                <div className="w-px h-8 bg-border" />
                <div className="text-center flex-1">
                  <p className="text-lg font-bold text-foreground">৳{(selected.spent || 0).toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">খরচ</p>
                </div>
              </div>

              {/* Content */}
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">{selected.title}</p>
                {selected.description && (
                  <p className="text-sm text-muted-foreground">{selected.description}</p>
                )}
              </div>

              {selected.link_url && (
                <a href={selected.link_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline block truncate">
                  {selected.link_url}
                </a>
              )}

              {/* Actions */}
              {selected.status === "pending" && (
                <>
                  <div className="space-y-2">
                    <Label>অ্যাডমিন নোট</Label>
                    <Textarea
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="ঐচ্ছিক নোট..."
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => updateAd.mutate({ adId: selected.id, status: "active", note: adminNote })}
                      disabled={updateAd.isPending}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" /> অ্যাপ্রুভ
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => updateAd.mutate({ adId: selected.id, status: "rejected", note: adminNote })}
                      disabled={updateAd.isPending}
                    >
                      <XCircle className="w-4 h-4 mr-1" /> রিজেক্ট ও রিফান্ড
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
                  <Pause className="w-4 h-4 mr-1" /> পজ করুন
                </Button>
              )}

              {selected.status === "paused" && (
                <Button
                  className="w-full"
                  onClick={() => updateAd.mutate({ adId: selected.id, status: "active", note: adminNote })}
                  disabled={updateAd.isPending}
                >
                  <Play className="w-4 h-4 mr-1" /> আবার চালু করুন
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

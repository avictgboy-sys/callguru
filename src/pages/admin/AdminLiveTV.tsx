import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAllLiveChannels, useCreateChannel, useUpdateChannel, useDeleteChannel, LiveChannel } from "@/hooks/useLiveChannels";
import { Plus, Pencil, Trash2, Tv, Radio } from "lucide-react";
import { toast } from "sonner";

const AdminLiveTV = () => {
  const { data: channels, isLoading } = useAllLiveChannels();
  const createChannel = useCreateChannel();
  const updateChannel = useUpdateChannel();
  const deleteChannel = useDeleteChannel();

  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<LiveChannel | null>(null);
  const [form, setForm] = useState({ name: "", stream_url: "", logo_url: "", category: "general", sort_order: 0, alternate_urls: "" });

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", stream_url: "", logo_url: "", category: "general", sort_order: 0, alternate_urls: "" });
    setShowDialog(true);
  };

  const openEdit = (ch: LiveChannel) => {
    setEditing(ch);
    setForm({ name: ch.name, stream_url: ch.stream_url, logo_url: ch.logo_url || "", category: ch.category, sort_order: ch.sort_order });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.stream_url) {
      toast.error("নাম এবং স্ট্রিম URL আবশ্যক");
      return;
    }
    try {
      if (editing) {
        await updateChannel.mutateAsync({ id: editing.id, ...form });
        toast.success("চ্যানেল আপডেট হয়েছে");
      } else {
        await createChannel.mutateAsync(form);
        toast.success("চ্যানেল যোগ হয়েছে");
      }
      setShowDialog(false);
    } catch (e: any) {
      toast.error(e.message || "Error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("এই চ্যানেল ডিলিট করবেন?")) return;
    try {
      await deleteChannel.mutateAsync(id);
      toast.success("চ্যানেল ডিলিট হয়েছে");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleToggleActive = async (ch: LiveChannel) => {
    await updateChannel.mutateAsync({ id: ch.id, is_active: !ch.is_active });
    toast.success(ch.is_active ? "চ্যানেল নিষ্ক্রিয় করা হয়েছে" : "চ্যানেল সক্রিয় করা হয়েছে");
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
              <Tv className="w-6 h-6 text-primary" /> Live TV চ্যানেল
            </h1>
            <p className="text-muted-foreground text-sm mt-1">M3U স্ট্রিম লিংক যোগ ও ম্যানেজ করুন</p>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="w-4 h-4" /> চ্যানেল যোগ করুন
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">লোড হচ্ছে...</div>
        ) : !channels?.length ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Radio className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>কোনো চ্যানেল নেই। প্রথম চ্যানেল যোগ করুন।</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {channels.map((ch) => (
              <Card key={ch.id} className={!ch.is_active ? "opacity-60" : ""}>
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    {ch.logo_url ? (
                      <img src={ch.logo_url} alt={ch.name} className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Tv className="w-5 h-5 text-primary" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-foreground">{ch.name}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-xs">{ch.stream_url}</p>
                      <p className="text-xs text-muted-foreground">Category: {ch.category} | Order: {ch.sort_order}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={ch.is_active} onCheckedChange={() => handleToggleActive(ch)} />
                    <Button variant="ghost" size="icon" onClick={() => openEdit(ch)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(ch.id)} className="text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "চ্যানেল এডিট করুন" : "নতুন চ্যানেল যোগ করুন"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>চ্যানেলের নাম *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="BTV, Channel i..." />
            </div>
            <div>
              <Label>M3U Stream URL *</Label>
              <Input value={form.stream_url} onChange={(e) => setForm({ ...form, stream_url: e.target.value })} placeholder="https://...m3u8" />
            </div>
            <div>
              <Label>Logo URL (ঐচ্ছিক)</Label>
              <Input value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} placeholder="https://..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>ক্যাটাগরি</Label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="news, sports..." />
              </div>
              <div>
                <Label>সর্ট অর্ডার</Label>
                <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>বাতিল</Button>
            <Button onClick={handleSave} disabled={createChannel.isPending || updateChannel.isPending}>
              {editing ? "আপডেট করুন" : "যোগ করুন"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminLiveTV;

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useM3uSources, useCreateM3uSource, useUpdateM3uSource, useDeleteM3uSource, M3uSource } from "@/hooks/useM3uSources";
import { useCreateChannel, useUpdateChannel, useAllLiveChannels } from "@/hooks/useLiveChannels";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, Link, Loader2, Download, Database } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const M3uSourcesManager = () => {
  const { data: sources, isLoading } = useM3uSources();
  const { data: channels } = useAllLiveChannels();
  const createSource = useCreateM3uSource();
  const updateSource = useUpdateM3uSource();
  const deleteSource = useDeleteM3uSource();
  const createChannel = useCreateChannel();
  const updateChannel = useUpdateChannel();

  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<M3uSource | null>(null);
  const [form, setForm] = useState({ name: "", url: "" });

  // Import state
  const [importingId, setImportingId] = useState<string | null>(null);
  const [parsedChannels, setParsedChannels] = useState<any[]>([]);
  const [selectedImports, setSelectedImports] = useState<Set<number>>(new Set());
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [importSourceId, setImportSourceId] = useState<string | null>(null);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", url: "" });
    setShowDialog(true);
  };

  const openEdit = (src: M3uSource) => {
    setEditing(src);
    setForm({ name: src.name, url: src.url });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.url) {
      toast.error("নাম এবং URL আবশ্যক");
      return;
    }
    try {
      if (editing) {
        await updateSource.mutateAsync({ id: editing.id, name: form.name, url: form.url });
        toast.success("সোর্স আপডেট হয়েছে");
      } else {
        await createSource.mutateAsync({ name: form.name, url: form.url });
        toast.success("সোর্স যোগ হয়েছে");
      }
      setShowDialog(false);
    } catch (e: any) {
      toast.error(e.message || "Error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("এই সোর্স ডিলিট করবেন?")) return;
    try {
      await deleteSource.mutateAsync(id);
      toast.success("সোর্স ডিলিট হয়েছে");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleFetchAndPreview = async (source: M3uSource) => {
    setImportingId(source.id);
    setImportSourceId(source.id);
    try {
      const { data, error } = await supabase.functions.invoke("parse-m3u", {
        body: { url: source.url },
      });
      if (error) throw error;
      if (data?.channels?.length) {
        setParsedChannels(data.channels);
        setSelectedImports(new Set(data.channels.map((_: any, i: number) => i)));
        setShowImportPreview(true);
        toast.success(`${data.channels.length}টি চ্যানেল পাওয়া গেছে`);
      } else {
        toast.error("কোনো চ্যানেল পাওয়া যায়নি");
      }
    } catch (e: any) {
      toast.error(e.message || "M3U পার্স করতে সমস্যা");
    } finally {
      setImportingId(null);
    }
  };

  const handleImportSelected = async () => {
    setImportingId(importSourceId);
    let added = 0;
    const existingNames = new Set((channels || []).map(c => c.name.toLowerCase()));

    for (const i of selectedImports) {
      const ch = parsedChannels[i];
      if (existingNames.has(ch.name.toLowerCase())) {
        const existing = (channels || []).find(c => c.name.toLowerCase() === ch.name.toLowerCase());
        if (existing && existing.stream_url !== ch.stream_url) {
          const alts = [...(existing.alternate_urls || [])];
          if (!alts.includes(ch.stream_url)) {
            alts.push(ch.stream_url);
            await updateChannel.mutateAsync({ id: existing.id, alternate_urls: alts } as any);
          }
        }
        continue;
      }
      try {
        await createChannel.mutateAsync({
          name: ch.name,
          stream_url: ch.stream_url,
          logo_url: ch.logo_url,
          category: ch.category || "general",
          sort_order: added,
        } as any);
        existingNames.add(ch.name.toLowerCase());
        added++;
      } catch {}
    }

    // Update source metadata
    if (importSourceId) {
      await updateSource.mutateAsync({
        id: importSourceId,
        last_imported_at: new Date().toISOString(),
        channel_count: parsedChannels.length,
      } as any);
    }

    toast.success(`${added}টি নতুন চ্যানেল যোগ হয়েছে`);
    setShowImportPreview(false);
    setParsedChannels([]);
    setImportingId(null);
    setImportSourceId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-heading font-bold text-foreground flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" /> M3U সোর্স লিংক
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">বিভিন্ন জায়গা থেকে M3U প্লেলিস্ট লিংক সংরক্ষণ ও ইমপোর্ট করুন</p>
        </div>
        <Button onClick={openCreate} size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" /> সোর্স যোগ করুন
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">লোড হচ্ছে...</div>
      ) : !sources?.length ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Link className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">কোনো M3U সোর্স নেই। প্রথম সোর্স যোগ করুন।</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2">
          {sources.map((src) => (
            <Card key={src.id} className={!src.is_active ? "opacity-60" : ""}>
              <CardContent className="flex items-center justify-between py-3 px-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link className="w-4 h-4 text-primary shrink-0" />
                    <p className="font-medium text-foreground text-sm truncate">{src.name}</p>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5 ml-6">{src.url}</p>
                  <div className="flex items-center gap-3 mt-1 ml-6">
                    {src.last_imported_at && (
                      <span className="text-[10px] text-muted-foreground">
                        শেষ ইমপোর্ট: {format(new Date(src.last_imported_at), "dd MMM yyyy, hh:mm a")}
                      </span>
                    )}
                    {src.channel_count > 0 && (
                      <span className="text-[10px] text-muted-foreground">
                        {src.channel_count}টি চ্যানেল
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFetchAndPreview(src)}
                    disabled={importingId === src.id}
                    className="gap-1 text-xs"
                  >
                    {importingId === src.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                    ইমপোর্ট
                  </Button>
                  <Switch
                    checked={src.is_active}
                    onCheckedChange={async (checked) => {
                      await updateSource.mutateAsync({ id: src.id, is_active: checked } as any);
                      toast.success(checked ? "সোর্স সক্রিয়" : "সোর্স নিষ্ক্রিয়");
                    }}
                  />
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(src)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(src.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Source Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "সোর্স এডিট করুন" : "নতুন M3U সোর্স যোগ করুন"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>সোর্সের নাম *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="যেমন: বাংলা IPTV, Sports Pack..." />
            </div>
            <div>
              <Label>M3U Playlist URL *</Label>
              <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://example.com/playlist.m3u" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>বাতিল</Button>
            <Button onClick={handleSave} disabled={createSource.isPending || updateSource.isPending}>
              {editing ? "আপডেট করুন" : "যোগ করুন"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Preview Dialog */}
      <Dialog open={showImportPreview} onOpenChange={(open) => { if (!open) { setShowImportPreview(false); setParsedChannels([]); } }}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>চ্যানেল ইমপোর্ট প্রিভিউ</DialogTitle>
          </DialogHeader>
          {parsedChannels.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {selectedImports.size}/{parsedChannels.length}টি সিলেক্ট করা হয়েছে
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (selectedImports.size === parsedChannels.length) {
                      setSelectedImports(new Set());
                    } else {
                      setSelectedImports(new Set(parsedChannels.map((_, i) => i)));
                    }
                  }}
                >
                  {selectedImports.size === parsedChannels.length ? "সব বাদ দিন" : "সব সিলেক্ট"}
                </Button>
              </div>
              <div className="space-y-1 max-h-60 overflow-y-auto border rounded-lg p-2">
                {parsedChannels.map((ch, i) => (
                  <label key={i} className="flex items-center gap-2 p-1.5 rounded hover:bg-muted cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={selectedImports.has(i)}
                      onChange={() => {
                        const next = new Set(selectedImports);
                        next.has(i) ? next.delete(i) : next.add(i);
                        setSelectedImports(next);
                      }}
                      className="rounded"
                    />
                    {ch.logo_url && <img src={ch.logo_url} className="w-6 h-6 rounded object-cover" />}
                    <span className="truncate flex-1">{ch.name}</span>
                    <span className="text-xs text-muted-foreground">{ch.category}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowImportPreview(false); setParsedChannels([]); }}>
              বাতিল
            </Button>
            <Button
              disabled={selectedImports.size === 0 || !!importingId}
              onClick={handleImportSelected}
            >
              {importingId ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {selectedImports.size}টি ইমপোর্ট করুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default M3uSourcesManager;

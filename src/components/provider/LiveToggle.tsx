import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Wifi, WifiOff, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const LiveToggle = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [toggling, setToggling] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const { data: services } = useQuery({
    queryKey: ["my-services", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("id, title, is_available, is_active")
        .eq("provider_id", user!.id)
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  const isLive = services?.some((s) => s.is_available) ?? false;

  const handleToggleAll = async (goLive: boolean) => {
    if (!user || !services?.length) return;
    setToggling(true);
    const { error } = await supabase
      .from("services")
      .update({ is_available: goLive })
      .eq("provider_id", user.id)
      .eq("is_active", true);
    setToggling(false);
    if (error) {
      toast.error("Failed to update status");
    } else {
      toast.success(goLive ? "You're now live! 🟢" : "You're offline now");
      qc.invalidateQueries({ queryKey: ["my-services"] });
      qc.invalidateQueries({ queryKey: ["services"] });
    }
  };

  const handleToggleSingle = async (serviceId: string, goLive: boolean) => {
    const { error } = await supabase
      .from("services")
      .update({ is_available: goLive })
      .eq("id", serviceId);
    if (error) {
      toast.error("Failed to update");
    } else {
      toast.success(goLive ? "Service is now live" : "Service is now offline");
      qc.invalidateQueries({ queryKey: ["my-services"] });
      qc.invalidateQueries({ queryKey: ["services"] });
    }
  };

  if (!services?.length) return null;

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div
        className={`flex items-center gap-3 px-4 py-3 transition-colors ${
          isLive ? "bg-accent/10 border-accent/30" : "bg-muted"
        }`}
      >
        {isLive ? (
          <Wifi className="w-5 h-5 text-accent" />
        ) : (
          <WifiOff className="w-5 h-5 text-muted-foreground" />
        )}
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">
            {isLive ? "You're Live" : "You're Offline"}
          </p>
          <p className="text-xs text-muted-foreground">
            {isLive ? "Clients can book you now" : "Toggle to go live"}
          </p>
        </div>
        <Switch
          checked={isLive}
          onCheckedChange={handleToggleAll}
          disabled={toggling}
        />
        {services.length > 1 && (
          <button onClick={() => setExpanded(!expanded)} className="text-muted-foreground hover:text-foreground">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>

      {expanded && services.length > 1 && (
        <div className="border-t border-border bg-card px-4 py-2 space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Per-service availability:</p>
          {services.map((s) => (
            <div key={s.id} className="flex items-center justify-between py-1.5">
              <span className="text-sm text-foreground truncate max-w-[200px]">{s.title}</span>
              <Switch
                checked={!!s.is_available}
                onCheckedChange={(v) => handleToggleSingle(s.id, v)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LiveToggle;

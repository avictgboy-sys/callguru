import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const LiveToggle = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [toggling, setToggling] = useState(false);

  // Get all services for this provider
  const { data: services } = useQuery({
    queryKey: ["my-services", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("id, title, is_available")
        .eq("provider_id", user!.id)
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  const isLive = services?.some((s) => s.is_available) ?? false;

  const handleToggle = async (goLive: boolean) => {
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

  if (!services?.length) return null;

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
      isLive 
        ? "bg-accent/10 border-accent/30" 
        : "bg-muted border-border"
    }`}>
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
        onCheckedChange={handleToggle}
        disabled={toggling}
      />
    </div>
  );
};

export default LiveToggle;

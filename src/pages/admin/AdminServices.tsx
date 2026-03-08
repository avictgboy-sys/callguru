import AdminLayout from "@/components/admin/AdminLayout";
import { useAdminServices, useToggleService } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

const AdminServices = () => {
  const { data: services, isLoading } = useAdminServices();
  const toggleService = useToggleService();

  const handleToggle = async (id: string, currentActive: boolean) => {
    try {
      await toggleService.mutateAsync({ id, is_active: !currentActive });
      toast.success(currentActive ? "Service disabled" : "Service enabled");
    } catch {
      toast.error("Failed to update service");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Service Management</h1>
          <p className="text-muted-foreground mt-1">{services?.length || 0} services</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Service</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Provider</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Category</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Price/min</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(services || []).map((s: any) => (
                    <tr key={s.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{s.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{s.description}</p>
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {s.provider?.full_name || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className="text-xs">
                          {s.service_categories?.name || "—"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-foreground font-medium">
                        ৳{Number(s.price_per_minute).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={s.is_active ? "default" : "destructive"} className="text-xs">
                          {s.is_active ? "Active" : "Disabled"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggle(s.id, s.is_active)}
                          title={s.is_active ? "Disable" : "Enable"}
                        >
                          {s.is_active ? (
                            <EyeOff className="w-4 h-4 text-destructive" />
                          ) : (
                            <Eye className="w-4 h-4 text-accent" />
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminServices;

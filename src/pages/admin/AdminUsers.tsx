import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAdminUsers, useVerifyUser, useToggleUserRole } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, CheckCircle, XCircle, Shield, UserPlus, Crown } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";

const AdminUsers = () => {
  const { data: users, isLoading } = useAdminUsers();
  const verifyUser = useVerifyUser();
  const toggleRole = useToggleUserRole();
  const [search, setSearch] = useState("");

  const filtered = (users || []).filter(
    (u) =>
      (u.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.referral_code || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleVerify = async (userId: string, verified: boolean) => {
    try {
      await verifyUser.mutateAsync({ userId, verified });
      toast.success(verified ? "User verified" : "Verification removed");
    } catch {
      toast.error("Failed to update verification");
    }
  };

  const handleRoleToggle = async (userId: string, role: string, currentRoles: string[]) => {
    const has = currentRoles.includes(role);
    try {
      await toggleRole.mutateAsync({ userId, role, add: !has });
      toast.success(has ? `Removed ${role} role` : `Added ${role} role`);
    } catch {
      toast.error("Failed to update role");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">User Management</h1>
            <p className="text-muted-foreground mt-1">{users?.length || 0} registered users</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or referral code..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">User</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Roles</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Verified</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Wallet</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Joined</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user) => (
                    <tr key={user.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-primary">
                              {(user.full_name || "U")[0].toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{user.full_name || "—"}</p>
                            <p className="text-xs text-muted-foreground">{user.referral_code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 flex-wrap">
                          {user.roles.map((r) => (
                            <Badge
                              key={r}
                              variant={r === "admin" ? "destructive" : r === "provider" ? "default" : "secondary"}
                              className="text-[10px]"
                            >
                              {r}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {user.is_verified ? (
                          <CheckCircle className="w-4 h-4 text-accent" />
                        ) : (
                          <XCircle className="w-4 h-4 text-muted-foreground" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        ${(user.wallet_balance || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleVerify(user.user_id, !user.is_verified)}
                            title={user.is_verified ? "Remove verification" : "Verify user"}
                          >
                            {user.is_verified ? (
                              <XCircle className="w-4 h-4" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRoleToggle(user.user_id, "provider", user.roles)}
                            title={user.roles.includes("provider") ? "Remove provider" : "Make provider"}
                          >
                            <UserPlus className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRoleToggle(user.user_id, "admin", user.roles)}
                            title={user.roles.includes("admin") ? "Remove admin" : "Make admin"}
                            className="text-destructive hover:text-destructive"
                          >
                            <Shield className="w-4 h-4" />
                          </Button>
                        </div>
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

export default AdminUsers;

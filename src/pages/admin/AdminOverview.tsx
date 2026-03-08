import AdminLayout from "@/components/admin/AdminLayout";
import { useAdminStats } from "@/hooks/useAdmin";
import { Users, Video, FileText, Shield, TrendingUp } from "lucide-react";

const statCards = [
  { key: "totalUsers", label: "Total Users", icon: Users, color: "text-primary" },
  { key: "totalProviders", label: "Providers", icon: Video, color: "text-accent" },
  { key: "totalPosts", label: "Posts", icon: FileText, color: "text-star" },
  { key: "totalServices", label: "Services", icon: TrendingUp, color: "text-primary" },
  { key: "totalAdmins", label: "Admins", icon: Shield, color: "text-destructive" },
] as const;

const AdminOverview = () => {
  const { data: stats, isLoading } = useAdminStats();

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Dashboard Overview</h1>
          <p className="text-muted-foreground mt-1">Platform health at a glance</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {statCards.map((card) => (
              <div
                key={card.key}
                className="bg-card rounded-xl border border-border p-6 shadow-card"
              >
                <div className="flex items-center justify-between mb-3">
                  <card.icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <p className="font-heading text-3xl font-bold text-foreground">
                  {stats?.[card.key] ?? 0}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{card.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Quick actions */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="font-heading text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <a href="/admin/users" className="flex items-center gap-3 p-4 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
              <Users className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Manage Users</p>
                <p className="text-xs text-muted-foreground">Verify, roles & moderation</p>
              </div>
            </a>
            <a href="/admin/content" className="flex items-center gap-3 p-4 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
              <FileText className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Moderate Content</p>
                <p className="text-xs text-muted-foreground">Review posts & comments</p>
              </div>
            </a>
            <a href="/admin/services" className="flex items-center gap-3 p-4 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
              <Video className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Manage Services</p>
                <p className="text-xs text-muted-foreground">Approve, disable listings</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminOverview;

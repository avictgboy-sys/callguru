import AdminLayout from "@/components/admin/AdminLayout";
import { useAdminStats } from "@/hooks/useAdmin";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["hsl(215, 90%, 50%)", "hsl(175, 65%, 45%)", "hsl(38, 92%, 50%)", "hsl(0, 72%, 51%)", "hsl(270, 60%, 55%)"];

const AdminAnalytics = () => {
  const { data: stats, isLoading } = useAdminStats();

  const barData = [
    { name: "Users", value: stats?.totalUsers || 0 },
    { name: "Providers", value: stats?.totalProviders || 0 },
    { name: "Services", value: stats?.totalServices || 0 },
    { name: "Posts", value: stats?.totalPosts || 0 },
    { name: "Admins", value: stats?.totalAdmins || 0 },
  ];

  const pieData = [
    { name: "Regular Users", value: Math.max((stats?.totalUsers || 0) - (stats?.totalProviders || 0) - (stats?.totalAdmins || 0), 0) },
    { name: "Providers", value: stats?.totalProviders || 0 },
    { name: "Admins", value: stats?.totalAdmins || 0 },
  ].filter((d) => d.value > 0);

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Platform Analytics</h1>
          <p className="text-muted-foreground mt-1">Key metrics and insights</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar chart */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="font-heading text-lg font-semibold text-foreground mb-4">
                Platform Overview
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
                  <XAxis dataKey="name" tick={{ fill: "hsl(215, 15%, 50%)", fontSize: 12 }} />
                  <YAxis tick={{ fill: "hsl(215, 15%, 50%)", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(0, 0%, 100%)",
                      border: "1px solid hsl(214, 20%, 90%)",
                      borderRadius: "8px",
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {barData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Pie chart */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="font-heading text-lg font-semibold text-foreground mb-4">
                User Distribution
              </h2>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "hsl(0, 0%, 100%)",
                        border: "1px solid hsl(214, 20%, 90%)",
                        borderRadius: "8px",
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-12">No user data yet</p>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminAnalytics;

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Video, LogOut, Wallet, User, Calendar, MessageSquare, Settings, Plus, Store } from "lucide-react";

const Dashboard = () => {
  const { user, profile, roles, signOut } = useAuth();
  const isProvider = roles.includes("provider");

  const menuItems = [
    { icon: User, label: "My Profile", href: "#" },
    { icon: Wallet, label: "Wallet", href: "#" },
    { icon: Calendar, label: "My Sessions", href: "#" },
    { icon: MessageSquare, label: "Messages", href: "#" },
    { icon: Settings, label: "Settings", href: "#" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Video className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-xl text-foreground">CallGuru</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/marketplace">
                <Store className="w-4 h-4 mr-1" /> Marketplace
              </Link>
            </Button>
            <span className="text-sm text-muted-foreground hidden sm:block">
              {user?.email}
            </span>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-1" /> Sign Out
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">
              Welcome back, {profile?.full_name || "User"}!
            </h1>
            <p className="text-muted-foreground mt-1">Here's your CallGuru dashboard</p>
          </div>
          <Button variant="hero" asChild>
            <Link to="/create-service">
              <Plus className="w-4 h-4 mr-1" />
              {isProvider ? "Add New Service" : "Become a Provider"}
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-card rounded-xl p-6 border border-border shadow-card">
            <p className="text-sm text-muted-foreground">Wallet Balance</p>
            <p className="font-heading text-2xl font-bold text-foreground mt-1">
              ${profile?.wallet_balance?.toFixed(2) ?? "0.00"}
            </p>
          </div>
          <div className="bg-card rounded-xl p-6 border border-border shadow-card">
            <p className="text-sm text-muted-foreground">Total Sessions</p>
            <p className="font-heading text-2xl font-bold text-foreground mt-1">0</p>
          </div>
          <div className="bg-card rounded-xl p-6 border border-border shadow-card">
            <p className="text-sm text-muted-foreground">Referral Code</p>
            <p className="font-heading text-lg font-bold text-primary mt-1">
              {profile?.referral_code ?? "—"}
            </p>
          </div>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {menuItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="flex flex-col items-center gap-2 p-5 rounded-xl bg-card border border-border shadow-card hover:shadow-elevated hover:-translate-y-0.5 transition-all"
            >
              <item.icon className="w-6 h-6 text-primary" />
              <span className="text-sm font-medium text-foreground">{item.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

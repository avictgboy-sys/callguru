import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Video, LogOut, Wallet, User, Calendar, MessageSquare, Settings, Plus, Store, Home, Shield, Gift, Menu, X, Megaphone } from "lucide-react";
import NotificationBell from "@/components/notifications/NotificationBell";
import LiveToggle from "@/components/provider/LiveToggle";
import { useState, useEffect } from "react";

const Dashboard = () => {
  const { user, profile, roles, signOut, refreshProfile } = useAuth();

  useEffect(() => {
    refreshProfile();
  }, []);
  const isProvider = roles.includes("provider");
  const isAdmin = roles.includes("admin");
  const [menuOpen, setMenuOpen] = useState(false);

  const menuItems = [
    { icon: User, label: "My Profile", href: user ? `/profile/${user.id}` : "#" },
    { icon: Wallet, label: "Wallet", href: "/wallet" },
    { icon: Megaphone, label: "My Ads", href: "/my-ads" },
    { icon: Gift, label: "Rewards", href: "/rewards" },
    { icon: Calendar, label: "My Sessions", href: "/call-history" },
    { icon: MessageSquare, label: "Messages", href: "/chat" },
    { icon: Settings, label: "Edit Profile", href: "/edit-profile" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card">
        <div className="flex items-center justify-between h-14 px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Video className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-lg text-foreground">CallGuru</span>
          </Link>
          
          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/"><Home className="w-4 h-4 mr-1" /> Feed</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/marketplace"><Store className="w-4 h-4 mr-1" /> Marketplace</Link>
            </Button>
            {isAdmin && (
              <Button variant="ghost" size="sm" asChild>
                <Link to="/admin"><Shield className="w-4 h-4 mr-1" /> Admin</Link>
              </Button>
            )}
            <NotificationBell />
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-1" /> Sign Out
            </Button>
          </div>

          {/* Mobile nav */}
          <div className="flex md:hidden items-center gap-2">
            <NotificationBell />
            <Button variant="ghost" size="icon" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-border bg-card px-4 py-3 space-y-1">
            <Link to="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary" onClick={() => setMenuOpen(false)}>
              <Home className="w-4 h-4 text-primary" /> <span className="text-sm">Feed</span>
            </Link>
            <Link to="/marketplace" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary" onClick={() => setMenuOpen(false)}>
              <Store className="w-4 h-4 text-primary" /> <span className="text-sm">Marketplace</span>
            </Link>
            {isAdmin && (
              <Link to="/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary" onClick={() => setMenuOpen(false)}>
                <Shield className="w-4 h-4 text-primary" /> <span className="text-sm">Admin</span>
              </Link>
            )}
            <button onClick={signOut} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary w-full text-left">
              <LogOut className="w-4 h-4 text-destructive" /> <span className="text-sm text-destructive">Sign Out</span>
            </button>
          </div>
        )}
      </nav>

      <div className="px-4 py-6 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
              Welcome, {profile?.full_name || "User"}!
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Here's your CallGuru dashboard</p>
          </div>
          <Button variant="hero" size="sm" asChild>
            <Link to="/create-service">
              <Plus className="w-4 h-4 mr-1" />
              {isProvider ? "Add Service" : "Become Provider"}
            </Link>
          </Button>
        </div>

        {isProvider && (
          <div className="mb-6">
            <LiveToggle />
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-card rounded-xl p-4 border border-border shadow-card">
            <p className="text-xs text-muted-foreground">Wallet</p>
            <p className="font-heading text-xl font-bold text-foreground mt-1">
              ৳{profile?.wallet_balance?.toFixed(2) ?? "0.00"}
            </p>
          </div>
          <Link to="/rewards" className="bg-card rounded-xl p-4 border border-border shadow-card hover:shadow-elevated transition-shadow">
            <p className="text-xs text-muted-foreground">Points</p>
            <p className="font-heading text-xl font-bold text-primary mt-1">
              {profile?.points ?? 0} pts
            </p>
          </Link>
          <div className="bg-card rounded-xl p-4 border border-border shadow-card">
            <p className="text-xs text-muted-foreground">Sessions</p>
            <p className="font-heading text-xl font-bold text-foreground mt-1">0</p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border shadow-card">
            <p className="text-xs text-muted-foreground">Referral</p>
            <p className="font-heading text-sm font-bold text-primary mt-1 truncate">
              {profile?.referral_code ?? "—"}
            </p>
          </div>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {menuItems.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border shadow-card hover:shadow-elevated hover:-translate-y-0.5 transition-all"
            >
              <item.icon className="w-5 h-5 text-primary" />
              <span className="text-xs font-medium text-foreground text-center">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

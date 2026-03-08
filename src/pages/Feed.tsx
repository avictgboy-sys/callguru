import { Link, useLocation } from "react-router-dom";
import { Video, Home, Compass, MessageCircle, User, Megaphone, Bell, Search, Menu, Plus, Users, Bookmark, Settings, TrendingUp, ShoppingBag, PlayCircle, Wrench, Tv } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useFeedPosts } from "@/hooks/useFeed";
import SuggestedServices, { useSuggestedServices } from "@/components/feed/SuggestedServices";
import SuggestedUsers, { useSuggestedUsers } from "@/components/feed/SuggestedUsers";
import CreatePostCard from "@/components/feed/CreatePostCard";
import PostCard from "@/components/feed/PostCard";
import AdBanner from "@/components/ads/AdBanner";
import SelfServeAdCard from "@/components/ads/SelfServeAdCard";
import NotificationBell from "@/components/notifications/NotificationBell";
// LiveTVSection removed from feed — available at /live-tv
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Feed = () => {
  const { user, profile } = useAuth();
  const { data: posts, isLoading } = useFeedPosts();
  const { data: suggestedServices } = useSuggestedServices();
  const { data: suggestedUsers } = useSuggestedUsers();
  const location = useLocation();

  const { data: selfAds } = useQuery({
    queryKey: ["active-self-ads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("self_ads" as any)
        .select("*")
        .eq("status", "active")
        .limit(10);
      if (error) throw error;
      return data as any[];
    },
  });

  const initials = (profile?.full_name || "U")[0].toUpperCase();

  const navItems = [
    { icon: Home, label: "Home", href: "/feed", active: true },
    { icon: PlayCircle, label: "Reels", href: "/reels", active: false },
    { icon: ShoppingBag, label: "Marketplace", href: "/marketplace", active: false },
    { icon: Users, label: "Groups", href: "/groups", active: false },
    { icon: Compass, label: "Discover", href: "/discover", active: false },
  ];

  return (
    <div className="min-h-screen bg-secondary/50">
      {/* ===== Facebook-style Top Navigation ===== */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-card shadow-sm border-b border-border">
        <div className="flex items-center justify-between h-14 px-4">
          {/* Left: Logo */}
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <Video className="w-6 h-6 text-primary-foreground" />
              </div>
            </Link>
            {/* Search bar - desktop */}
            <div className="hidden md:flex items-center bg-secondary rounded-full px-4 py-2 ml-2 w-[240px]">
              <Search className="w-4 h-4 text-muted-foreground mr-2" />
              <input
                type="text"
                placeholder="Search CallGuru"
                className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
              />
            </div>
          </div>

          {/* Center: Nav tabs - desktop */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className={`relative flex items-center justify-center px-8 py-3 rounded-lg transition-colors ${
                  item.active
                    ? "text-primary"
                    : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                <item.icon className="w-6 h-6" />
                {item.active && (
                  <div className="absolute bottom-0 left-2 right-2 h-[3px] bg-primary rounded-t-full" />
                )}
              </Link>
            ))}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1">
            {user ? (
              <>
                <Button variant="ghost" size="icon" className="rounded-full bg-secondary hover:bg-secondary/80 md:hidden">
                  <Search className="w-5 h-5 text-foreground" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full bg-secondary hover:bg-secondary/80 hidden md:flex">
                  <Menu className="w-5 h-5 text-foreground" />
                </Button>
                <div className="relative">
                  <NotificationBell />
                </div>
                <Button variant="ghost" size="icon" className="rounded-full bg-secondary hover:bg-secondary/80" asChild>
                  <Link to="/chat">
                    <MessageCircle className="w-5 h-5 text-foreground" />
                  </Link>
                </Button>
                <Link to="/dashboard">
                  <Avatar className="w-9 h-9 border-2 border-transparent hover:border-primary transition-colors cursor-pointer">
                    <AvatarImage src={profile?.avatar_url || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Link>
              </>
            ) : (
              <Button className="rounded-full bg-primary text-primary-foreground font-semibold" size="sm" asChild>
                <Link to="/login">Log In</Link>
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* ===== Main Content ===== */}
      <div className="pt-14 pb-16 md:pb-0">
        <div className="max-w-[1920px] mx-auto flex">
          {/* ===== Left Sidebar - Desktop ===== */}
          <aside className="hidden lg:block w-[280px] shrink-0 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto py-4 px-2">
            {user && (
              <div className="space-y-0.5">
                <Link
                  to="/dashboard"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-card transition-colors"
                >
                  <Avatar className="w-9 h-9">
                    <AvatarImage src={profile?.avatar_url || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-[15px] font-semibold text-foreground">
                    {profile?.full_name || "User"}
                  </span>
                </Link>

                <SidebarLink icon={Users} label="Friends" href="/feed" />
                <SidebarLink icon={Compass} label="Explore" href="/marketplace" />
                <SidebarLink icon={MessageCircle} label="Messenger" href="/chat" />
                <SidebarLink icon={Bookmark} label="Saved" href="/feed" />
                <SidebarLink icon={PlayCircle} label="Watch" href="/feed" />
                <SidebarLink icon={ShoppingBag} label="Marketplace" href="/marketplace" />
                <SidebarLink icon={Megaphone} label="My Ads" href="/my-ads" />
                <SidebarLink icon={TrendingUp} label="Call History" href="/call-history" />
                <SidebarLink icon={Wrench} label="Home Service" href="/home-services" />
                <SidebarLink icon={Settings} label="Settings" href="/dashboard" />

                <div className="border-t border-border my-3 mx-3" />
                <p className="text-xs text-muted-foreground px-3 py-2">
                  CallGuru © {new Date().getFullYear()} · Privacy · Terms
                </p>
              </div>
            )}
          </aside>

          {/* ===== Center Feed ===== */}
          <main className="flex-1 max-w-[680px] mx-auto px-4 py-4 space-y-4">
            {/* Stories / Quick Actions Bar */}
            {user && (
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <Link
                  to="/create-ad"
                  className="shrink-0 w-28 h-40 rounded-xl bg-card border border-border overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex-1 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <Avatar className="w-14 h-14 border-4 border-card">
                      <AvatarImage src={profile?.avatar_url || ""} />
                      <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="relative h-12 flex items-end justify-center pb-2">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-primary flex items-center justify-center border-4 border-card">
                      <Plus className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <span className="text-xs font-semibold text-foreground">Create Story</span>
                  </div>
                </Link>
                {/* Placeholder story cards */}
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="shrink-0 w-28 h-40 rounded-xl overflow-hidden relative shadow-sm"
                    style={{
                      background: `linear-gradient(135deg, hsl(${200 + i * 30}, 70%, 60%), hsl(${220 + i * 30}, 80%, 40%))`,
                    }}
                  >
                    <div className="absolute top-2 left-2">
                      <div className="w-8 h-8 rounded-full bg-card/30 backdrop-blur border-2 border-primary flex items-center justify-center">
                        <span className="text-[10px] font-bold text-primary-foreground">U</span>
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                      <p className="text-[11px] font-medium text-white">User {i}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Live TV moved to dedicated /live-tv page */}

            {/* Create post */}
            {user && <CreatePostCard />}

            {/* Promoted Ad CTA */}
            {user && (
              <Link to="/create-ad" className="block">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:shadow-sm transition-shadow">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Megaphone className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">বিজ্ঞাপন তৈরি করুন</p>
                    <p className="text-xs text-muted-foreground">আপনার পণ্য/সার্ভিস প্রমোট করুন</p>
                  </div>
                  <div className="text-xs font-medium text-primary">Create →</div>
                </div>
              </Link>
            )}

            {/* Feed posts */}
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : posts?.length === 0 ? (
              <div className="bg-card rounded-xl border border-border p-8 text-center">
                <Compass className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="font-heading text-lg font-semibold text-foreground">No posts yet</h3>
                <p className="text-sm text-muted-foreground mt-1">Be the first to share something!</p>
              </div>
            ) : (
              posts?.map((post, index) => (
                <div key={post.id}>
                  <PostCard post={post} />
                  {/* Suggested Services every 5 posts */}
                  {(index + 1) % 5 === 0 && suggestedServices && suggestedServices.length > 0 && (
                    <div className="mt-4">
                      <SuggestedServices
                        services={suggestedServices}
                        startIndex={(Math.floor(index / 5) * 3) % suggestedServices.length}
                      />
                    </div>
                  )}
                  {/* Suggested Users every 7 posts */}
                  {(index + 1) % 7 === 0 && suggestedUsers && suggestedUsers.length > 0 && (
                    <div className="mt-4">
                      <SuggestedUsers
                        users={suggestedUsers}
                        startIndex={(Math.floor(index / 7) * 4) % suggestedUsers.length}
                      />
                    </div>
                  )}
                  {(index + 1) % 3 === 0 && (index + 1) % 5 !== 0 && (
                    <>
                      {selfAds && selfAds[Math.floor(index / 3) % (selfAds.length || 1)] ? (
                        <div className="mt-4">
                          <SelfServeAdCard ad={selfAds[Math.floor(index / 3) % selfAds.length]} />
                        </div>
                      ) : (
                        <AdBanner slotId={`feed-inline-${index}`} className="mt-4" />
                      )}
                    </>
                  )}
                </div>
              ))
            )}
          </main>

          {/* ===== Right Sidebar - Desktop ===== */}
          <aside className="hidden xl:block w-[280px] shrink-0 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto py-4 px-4">
            {/* Sponsored */}
            <div className="mb-4">
              <h4 className="text-[13px] font-semibold text-muted-foreground mb-3">Sponsored</h4>
              {selfAds && selfAds.length > 0 ? (
                <div className="space-y-3">
                  {selfAds.slice(0, 2).map((ad: any) => (
                    <a
                      key={ad.id}
                      href={ad.link_url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex gap-3 group cursor-pointer"
                    >
                      <div className="w-[120px] h-[120px] rounded-lg overflow-hidden bg-secondary shrink-0">
                        {ad.image_url ? (
                          <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary/5">
                            <Megaphone className="w-6 h-6 text-primary/40" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-foreground group-hover:underline line-clamp-2">
                          {ad.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                          {ad.link_url?.replace("https://", "").split("/")[0] || "callguru.com"}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-card border border-border text-center">
                  <p className="text-xs text-muted-foreground">No sponsored content</p>
                </div>
              )}
            </div>

            <div className="border-t border-border my-3" />

            {/* Contacts */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-[13px] font-semibold text-muted-foreground">Contacts</h4>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground">
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-card transition-colors cursor-pointer"
                  >
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">U</span>
                      </div>
                      {i <= 2 && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-secondary" />
                      )}
                    </div>
                    <span className="text-[13px] font-medium text-foreground">User {i}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* ===== Bottom nav (mobile) ===== */}
      {user && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border md:hidden z-50">
          <div className="flex items-center justify-around h-14">
            <Link to="/feed" className="flex flex-col items-center gap-0.5 py-1">
              <Home className="w-6 h-6 text-primary" />
              <div className="w-5 h-[3px] bg-primary rounded-full" />
            </Link>
            <Link to="/live-tv" className="flex flex-col items-center gap-0.5 py-1 text-muted-foreground">
              <Tv className="w-6 h-6" />
            </Link>
            <Link to="/reels" className="flex flex-col items-center gap-0.5 py-1 text-muted-foreground">
              <PlayCircle className="w-6 h-6" />
            </Link>
            <Link to="/chat" className="flex flex-col items-center gap-0.5 py-1 text-muted-foreground">
              <MessageCircle className="w-6 h-6" />
            </Link>
            <Link to="/dashboard" className="flex flex-col items-center gap-0.5 py-1 text-muted-foreground">
              <User className="w-6 h-6" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

// Sidebar link component
const SidebarLink = ({ icon: Icon, label, href }: { icon: any; label: string; href: string }) => (
  <Link
    to={href}
    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-card transition-colors"
  >
    <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
      <Icon className="w-5 h-5 text-primary" />
    </div>
    <span className="text-[15px] font-medium text-foreground">{label}</span>
  </Link>
);

export default Feed;

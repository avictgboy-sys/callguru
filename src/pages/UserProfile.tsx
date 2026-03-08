import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile, useUserPosts, useUserServices, useUserFollowers, useUserFollowing, useIsFollowing } from "@/hooks/useUserProfile";
import { useFollowUser } from "@/hooks/useFeed";
import { useStartChat } from "@/hooks/useChat";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PostCard from "@/components/feed/PostCard";
import ServiceCard from "@/components/marketplace/ServiceCard";
import { Video, ArrowLeft, BadgeCheck, UserPlus, UserMinus, MessageSquare, Users } from "lucide-react";
import { toast } from "sonner";

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: profile, isLoading } = useUserProfile(userId!);
  const { data: posts } = useUserPosts(userId!);
  const { data: services } = useUserServices(userId!);
  const { data: followers } = useUserFollowers(userId!);
  const { data: following } = useUserFollowing(userId!);
  const { data: isFollowing } = useIsFollowing(userId!);
  const followMutation = useFollowUser();
  const startChat = useStartChat();

  const isOwn = user?.id === userId;

  const handleFollow = async () => {
    if (!user) {
      toast.error("Please log in first");
      return;
    }
    await followMutation.mutateAsync({ targetUserId: userId!, isFollowing: !!isFollowing });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading profile…</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">User not found</p>
        <Button variant="ghost" asChild><Link to="/feed"><ArrowLeft className="w-4 h-4 mr-1" /> Back to Feed</Link></Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/feed"><ArrowLeft className="w-4 h-4 mr-1" /> Back</Link>
          </Button>
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Video className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-xl text-foreground">CallGuru</span>
          </Link>
          <div className="w-20" />
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Profile header */}
        <div className="bg-card rounded-2xl border border-border shadow-card p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name || ""} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-primary">
                  {(profile.full_name || "U")[0].toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-heading text-2xl font-bold text-foreground truncate">
                  {profile.full_name || "Anonymous"}
                </h1>
                {profile.is_verified && <BadgeCheck className="w-5 h-5 text-primary flex-shrink-0" />}
              </div>
              {profile.bio && (
                <p className="text-sm text-muted-foreground mt-1">{profile.bio}</p>
              )}

              {/* Stats row */}
              <div className="flex items-center gap-5 mt-3 text-sm">
                <div>
                  <span className="font-bold text-foreground">{posts?.length ?? 0}</span>
                  <span className="text-muted-foreground ml-1">posts</span>
                </div>
                <div>
                  <span className="font-bold text-foreground">{followers?.length ?? profile.followers_count ?? 0}</span>
                  <span className="text-muted-foreground ml-1">followers</span>
                </div>
                <div>
                  <span className="font-bold text-foreground">{following?.length ?? profile.following_count ?? 0}</span>
                  <span className="text-muted-foreground ml-1">following</span>
                </div>
              </div>

              {/* Actions */}
              {!isOwn && user && (
                <div className="flex gap-2 mt-4">
                  <Button
                    variant={isFollowing ? "outline" : "hero"}
                    size="sm"
                    onClick={handleFollow}
                    disabled={followMutation.isPending}
                  >
                    {isFollowing ? (
                      <><UserMinus className="w-4 h-4 mr-1" /> Unfollow</>
                    ) : (
                      <><UserPlus className="w-4 h-4 mr-1" /> Follow</>
                    )}
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/chat">
                      <MessageSquare className="w-4 h-4 mr-1" /> Message
                    </Link>
                  </Button>
                </div>
              )}
              {isOwn && (
                <Button variant="outline" size="sm" className="mt-4" asChild>
                  <Link to="/dashboard">Edit Profile</Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="w-full grid grid-cols-4 mb-4">
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="followers">Followers</TabsTrigger>
            <TabsTrigger value="following">Following</TabsTrigger>
          </TabsList>

          <TabsContent value="posts">
            {!posts?.length ? (
              <p className="text-center text-muted-foreground py-12 text-sm">No posts yet</p>
            ) : (
              <div className="space-y-4">
                {posts.map((post: any) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="services">
            {!services?.length ? (
              <p className="text-center text-muted-foreground py-12 text-sm">No services listed</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {services.map((s: any) => (
                  <ServiceCard key={s.id} service={s} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="followers">
            {!followers?.length ? (
              <p className="text-center text-muted-foreground py-12 text-sm">No followers yet</p>
            ) : (
              <div className="space-y-2">
                {followers.map((p: any) => (
                  <Link
                    key={p.user_id}
                    to={`/profile/${p.user_id}`}
                    className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:shadow-card transition-shadow"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                      {p.avatar_url ? (
                        <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-bold text-primary">
                          {(p.full_name || "U")[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-foreground">{p.full_name || "Anonymous"}</span>
                      {p.is_verified && <BadgeCheck className="w-4 h-4 text-primary" />}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="following">
            {!following?.length ? (
              <p className="text-center text-muted-foreground py-12 text-sm">Not following anyone</p>
            ) : (
              <div className="space-y-2">
                {following.map((p: any) => (
                  <Link
                    key={p.user_id}
                    to={`/profile/${p.user_id}`}
                    className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:shadow-card transition-shadow"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                      {p.avatar_url ? (
                        <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-bold text-primary">
                          {(p.full_name || "U")[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-foreground">{p.full_name || "Anonymous"}</span>
                      {p.is_verified && <BadgeCheck className="w-4 h-4 text-primary" />}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UserProfile;

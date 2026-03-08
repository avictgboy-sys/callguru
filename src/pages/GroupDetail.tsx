import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Users, Lock, EyeOff, Globe, UserPlus, LogOut, Send, Shield, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  useGroupDetail, useGroupPosts, useMyMembership,
  useJoinGroup, useLeaveGroup, useCreateGroupPost,
  useGroupMembers, usePendingMembers, useApproveMember,
} from "@/hooks/useGroups";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const GroupDetail = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const { user } = useAuth();
  const { data: group, isLoading } = useGroupDetail(groupId);
  const { data: posts } = useGroupPosts(groupId);
  const { data: membership } = useMyMembership(groupId);
  const { data: members } = useGroupMembers(groupId);
  const { data: pending } = usePendingMembers(groupId);
  const joinGroup = useJoinGroup();
  const leaveGroup = useLeaveGroup();
  const createPost = useCreateGroupPost();
  const approveMember = useApproveMember();
  const [newPost, setNewPost] = useState("");
  const [tab, setTab] = useState<"posts" | "members" | "pending">("posts");

  const isMember = membership?.status === "approved";
  const isAdmin = membership?.role === "admin" || membership?.role === "moderator";
  const isPending = membership?.status === "pending";

  const handleJoin = async () => {
    if (!user) return toast.error("Please log in first");
    try {
      await joinGroup.mutateAsync({ groupId: groupId!, privacy: group?.privacy || "public" });
      toast.success(group?.privacy === "public" ? "Joined!" : "Join request sent!");
    } catch (err: any) { toast.error(err.message); }
  };

  const handleLeave = async () => {
    try {
      await leaveGroup.mutateAsync(groupId!);
      toast.success("Left group");
    } catch (err: any) { toast.error(err.message); }
  };

  const handlePost = async () => {
    if (!newPost.trim()) return;
    try {
      await createPost.mutateAsync({ groupId: groupId!, content: newPost });
      setNewPost("");
      toast.success("Posted!");
    } catch (err: any) { toast.error(err.message); }
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/50">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!group) return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/50">
      <p className="text-muted-foreground">Group not found</p>
    </div>
  );

  const privacyIcon = group.privacy === "private" ? <Lock className="w-3.5 h-3.5" /> : group.privacy === "secret" ? <EyeOff className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />;

  return (
    <div className="min-h-screen bg-secondary/50">
      <div className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border">
        <div className="flex items-center gap-3 h-14 px-4 max-w-3xl mx-auto">
          <Link to="/groups"><ArrowLeft className="w-5 h-5 text-foreground" /></Link>
          <h1 className="text-lg font-bold text-foreground truncate">{group.name}</h1>
        </div>
      </div>

      <div className="pt-14 max-w-3xl mx-auto">
        {/* Cover */}
        <div className="h-40 bg-gradient-to-br from-primary/20 to-accent/20 relative">
          {group.cover_image_url && <img src={group.cover_image_url} alt="" className="w-full h-full object-cover" />}
        </div>

        {/* Group Info */}
        <div className="px-4 pb-4 bg-card border-b border-border">
          <h2 className="text-xl font-bold text-foreground mt-4">{group.name}</h2>
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            <Badge variant="secondary" className="gap-1 text-xs">{privacyIcon} {group.privacy}</Badge>
            <span>·</span>
            <span>{group.member_count} members</span>
          </div>
          {group.description && <p className="text-sm text-muted-foreground mt-2">{group.description}</p>}

          <div className="flex gap-2 mt-4">
            {!user ? (
              <Button size="sm" asChild><Link to="/login">Log in to join</Link></Button>
            ) : !membership ? (
              <Button size="sm" onClick={handleJoin} disabled={joinGroup.isPending} className="gap-1">
                <UserPlus className="w-4 h-4" /> Join Group
              </Button>
            ) : isPending ? (
              <Button size="sm" variant="secondary" disabled className="gap-1">
                <Clock className="w-4 h-4" /> Pending Approval
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={handleLeave} disabled={leaveGroup.isPending} className="gap-1">
                <LogOut className="w-4 h-4" /> Leave
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-card border-b border-border">
          {["posts", "members", ...(isAdmin ? ["pending"] : [])].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t as any)}
              className={`flex-1 py-3 text-sm font-medium capitalize transition-colors ${
                tab === t ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              {t} {t === "pending" && pending?.length ? `(${pending.length})` : ""}
            </button>
          ))}
        </div>

        <div className="px-4 py-4 space-y-4">
          {tab === "posts" && (
            <>
              {isMember && (
                <Card>
                  <CardContent className="p-4">
                    <Textarea
                      placeholder="Write something..."
                      value={newPost}
                      onChange={(e) => setNewPost(e.target.value)}
                      rows={3}
                    />
                    <div className="flex justify-end mt-2">
                      <Button size="sm" onClick={handlePost} disabled={createPost.isPending} className="gap-1">
                        <Send className="w-4 h-4" /> Post
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {!posts?.length ? (
                <p className="text-center text-muted-foreground py-8">No posts yet</p>
              ) : posts.map((p: any) => (
                <Card key={p.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="w-9 h-9">
                        <AvatarImage src={p.author?.avatar_url || ""} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {(p.author?.full_name || "U")[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{p.author?.full_name || "User"}</p>
                        <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}</p>
                      </div>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{p.content}</p>
                    {p.image_url && <img src={p.image_url} alt="" className="mt-3 rounded-lg max-h-80 object-cover w-full" />}
                  </CardContent>
                </Card>
              ))}
            </>
          )}

          {tab === "members" && (
            <div className="space-y-2">
              {members?.map((m: any) => (
                <div key={m.id} className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={m.profile?.avatar_url || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary">{(m.profile?.full_name || "U")[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{m.profile?.full_name || "User"}</p>
                    <Badge variant="secondary" className="text-xs mt-0.5">{m.role}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "pending" && isAdmin && (
            <div className="space-y-2">
              {!pending?.length ? (
                <p className="text-center text-muted-foreground py-8">No pending requests</p>
              ) : pending.map((m: any) => (
                <div key={m.id} className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={m.profile?.avatar_url || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary">{(m.profile?.full_name || "U")[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{m.profile?.full_name || "User"}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => approveMember.mutate({ memberId: m.id, groupId: groupId! })}
                    disabled={approveMember.isPending}
                  >
                    Approve
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupDetail;

import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Heart, Send, UserPlus, UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  usePageDetail, usePagePosts, useMyPageFollow,
  useFollowPage, useUnfollowPage, useCreatePagePost,
} from "@/hooks/usePages";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const PageDetail = () => {
  const { pageId } = useParams<{ pageId: string }>();
  const { user } = useAuth();
  const { data: page, isLoading } = usePageDetail(pageId);
  const { data: posts } = usePagePosts(pageId);
  const { data: myFollow } = useMyPageFollow(pageId);
  const followPage = useFollowPage();
  const unfollowPage = useUnfollowPage();
  const createPost = useCreatePagePost();
  const [newPost, setNewPost] = useState("");

  const isFollowing = !!myFollow;
  const isCreator = user?.id === page?.creator_id;

  const handleFollow = async () => {
    if (!user) return toast.error("Please log in first");
    try {
      if (isFollowing) {
        await unfollowPage.mutateAsync(pageId!);
        toast.success("Unfollowed");
      } else {
        await followPage.mutateAsync(pageId!);
        toast.success("Following!");
      }
    } catch (err: any) { toast.error(err.message); }
  };

  const handlePost = async () => {
    if (!newPost.trim()) return;
    try {
      await createPost.mutateAsync({ pageId: pageId!, content: newPost });
      setNewPost("");
      toast.success("Posted!");
    } catch (err: any) { toast.error(err.message); }
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/50">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!page) return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/50">
      <p className="text-muted-foreground">Page not found</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-secondary/50">
      <div className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border">
        <div className="flex items-center gap-3 h-14 px-4 max-w-3xl mx-auto">
          <Link to="/pages"><ArrowLeft className="w-5 h-5 text-foreground" /></Link>
          <h1 className="text-lg font-bold text-foreground truncate">{page.name}</h1>
        </div>
      </div>

      <div className="pt-14 max-w-3xl mx-auto">
        {/* Cover */}
        <div className="h-44 bg-gradient-to-br from-primary/20 to-accent/20 relative">
          {page.cover_image_url && <img src={page.cover_image_url} alt="" className="w-full h-full object-cover" />}
        </div>

        {/* Page Info */}
        <div className="px-4 pb-4 bg-card border-b border-border relative">
          <Avatar className="w-20 h-20 border-4 border-card -mt-10 relative z-10">
            <AvatarImage src={page.avatar_url || ""} />
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">{(page.name || "P")[0]}</AvatarFallback>
          </Avatar>
          <h2 className="text-xl font-bold text-foreground mt-2">{page.name}</h2>
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            <Badge variant="secondary" className="text-xs">{page.category || "General"}</Badge>
            <span>·</span>
            <span>{page.follower_count} followers</span>
          </div>
          {page.description && <p className="text-sm text-muted-foreground mt-2">{page.description}</p>}

          <div className="flex gap-2 mt-4">
            {!user ? (
              <Button size="sm" asChild><Link to="/login">Log in</Link></Button>
            ) : (
              <Button
                size="sm"
                variant={isFollowing ? "outline" : "default"}
                onClick={handleFollow}
                disabled={followPage.isPending || unfollowPage.isPending}
                className="gap-1"
              >
                {isFollowing ? <><UserMinus className="w-4 h-4" /> Unfollow</> : <><UserPlus className="w-4 h-4" /> Follow</>}
              </Button>
            )}
          </div>
        </div>

        <div className="px-4 py-4 space-y-4">
          {isCreator && (
            <Card>
              <CardContent className="p-4">
                <Textarea
                  placeholder="Write something on your page..."
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
                    <AvatarImage src={page.avatar_url || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">{(page.name || "P")[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{page.name}</p>
                    <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}</p>
                  </div>
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap">{p.content}</p>
                {p.image_url && <img src={p.image_url} alt="" className="mt-3 rounded-lg max-h-80 object-cover w-full" />}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PageDetail;

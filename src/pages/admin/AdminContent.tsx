import AdminLayout from "@/components/admin/AdminLayout";
import { useAdminPosts, useDeletePost } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Trash2, Image, Video, FileText } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const typeIcon: Record<string, React.ReactNode> = {
  text: <FileText className="w-4 h-4 text-muted-foreground" />,
  image: <Image className="w-4 h-4 text-primary" />,
  video: <Video className="w-4 h-4 text-accent" />,
};

const AdminContent = () => {
  const { data: posts, isLoading } = useAdminPosts();
  const deletePost = useDeletePost();

  const handleDelete = async (postId: string) => {
    if (!confirm("Delete this post permanently?")) return;
    try {
      await deletePost.mutateAsync(postId);
      toast.success("Post deleted");
    } catch {
      toast.error("Failed to delete post");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Content Moderation</h1>
          <p className="text-muted-foreground mt-1">{posts?.length || 0} posts</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {posts?.map((post: any) => (
              <div
                key={post.id}
                className="bg-card rounded-xl border border-border p-5 flex items-start justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {typeIcon[post.post_type] || typeIcon.text}
                    <span className="text-sm font-medium text-foreground">
                      {post.author?.full_name || "Anonymous"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  {post.content && (
                    <p className="text-sm text-foreground line-clamp-2">{post.content}</p>
                  )}
                  {post.image_url && (
                    <img
                      src={post.image_url}
                      alt="Post"
                      className="mt-2 rounded-lg max-h-32 object-cover"
                    />
                  )}
                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                    <span>{post.likes_count} likes</span>
                    <span>{post.comments_count} comments</span>
                    <span>{post.shares_count} shares</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:bg-destructive/10 shrink-0"
                  onClick={() => handleDelete(post.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {posts?.length === 0 && (
              <p className="text-center text-muted-foreground py-12">No posts yet</p>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminContent;

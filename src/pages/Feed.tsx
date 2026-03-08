import { Link } from "react-router-dom";
import { Video, Home, Compass, MessageCircle, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useFeedPosts } from "@/hooks/useFeed";
import CreatePostCard from "@/components/feed/CreatePostCard";
import PostCard from "@/components/feed/PostCard";

const Feed = () => {
  const { user, profile } = useAuth();
  const { data: posts, isLoading } = useFeedPosts();

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Video className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-lg text-foreground">CallGuru</span>
          </Link>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/dashboard">
                    <User className="w-4 h-4" />
                  </Link>
                </Button>
              </>
            ) : (
              <Button variant="hero" size="sm" asChild>
                <Link to="/login">Log In</Link>
              </Button>
            )}
          </div>
        </div>
      </nav>

      <div className="pt-14">
        <div className="container mx-auto max-w-2xl px-4 py-6 space-y-4">
          {/* Create post */}
          {user && <CreatePostCard />}

          {/* Feed */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : posts?.length === 0 ? (
            <div className="text-center py-16">
              <Compass className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-heading text-lg font-semibold text-foreground">No posts yet</h3>
              <p className="text-sm text-muted-foreground mt-1">Be the first to share something!</p>
            </div>
          ) : (
            posts?.map((post) => <PostCard key={post.id} post={post} />)
          )}
        </div>
      </div>

      {/* Bottom nav (mobile) */}
      {user && (
        <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur border-t border-border md:hidden">
          <div className="flex items-center justify-around h-14">
            <Link to="/feed" className="flex flex-col items-center text-primary">
              <Home className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">Feed</span>
            </Link>
            <Link to="/marketplace" className="flex flex-col items-center text-muted-foreground">
              <Compass className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">Explore</span>
            </Link>
            <Link to="/chat" className="flex flex-col items-center text-muted-foreground">
              <MessageCircle className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">Chat</span>
            </Link>
            <Link to="/dashboard" className="flex flex-col items-center text-muted-foreground">
              <User className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">Profile</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Feed;

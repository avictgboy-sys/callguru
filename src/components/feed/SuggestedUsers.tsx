import { Link } from "react-router-dom";
import { BadgeCheck, UserPlus, UserCheck, ChevronRight, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useIsFollowing, useToggleFollow } from "@/hooks/useFollow";

interface SuggestedUser {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  is_verified: boolean | null;
  bio: string | null;
  followers_count: number;
}

export const useSuggestedUsers = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["suggested-users", user?.id],
    enabled: !!user,
    queryFn: async () => {
      // Get users the current user is already following
      const { data: following } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user!.id);
      const followingIds = new Set((following || []).map((f: any) => f.following_id));
      followingIds.add(user!.id); // exclude self

      const { data, error } = await supabase
        .from("profiles_public")
        .select("user_id, full_name, avatar_url, is_verified, bio, followers_count")
        .order("followers_count", { ascending: false })
        .limit(30);
      if (error) throw error;

      // Filter out already-followed users and self
      return (data || [])
        .filter((p: any) => !followingIds.has(p.user_id))
        .slice(0, 10) as SuggestedUser[];
    },
    staleTime: 5 * 60 * 1000,
  });
};

const SuggestedUserCard = ({ profile }: { profile: SuggestedUser }) => {
  const { user } = useAuth();
  const { data: isFollowing } = useIsFollowing(profile.user_id);
  const toggleFollow = useToggleFollow();

  const name = profile.full_name || "User";
  const initials = name[0].toUpperCase();

  const handleFollow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    toggleFollow.mutate({ targetUserId: profile.user_id, isFollowing: !!isFollowing });
  };

  return (
    <Link
      to={`/profile/${profile.user_id}`}
      className="shrink-0 w-[150px] rounded-xl border border-border bg-secondary/30 hover:bg-secondary/60 transition-colors overflow-hidden flex flex-col items-center"
    >
      <div className="flex flex-col items-center pt-4 pb-2 px-3 w-full">
        <Avatar className="w-16 h-16 mb-2 border-2 border-primary/20">
          <AvatarImage src={profile.avatar_url || ""} />
          <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex items-center gap-1">
          <span className="text-sm font-semibold text-foreground truncate max-w-[110px]">
            {name}
          </span>
          {profile.is_verified && (
            <BadgeCheck className="w-3.5 h-3.5 text-primary shrink-0" />
          )}
        </div>
        {profile.bio && (
          <span className="text-[10px] text-muted-foreground line-clamp-1 text-center mt-0.5">
            {profile.bio}
          </span>
        )}
        <span className="text-[11px] text-muted-foreground mt-1">
          {profile.followers_count} followers
        </span>
      </div>

      <div className="px-3 pb-3 w-full">
        <Button
          variant={isFollowing ? "outline" : "default"}
          size="sm"
          className="w-full h-8 text-xs rounded-full gap-1"
          onClick={handleFollow}
          disabled={toggleFollow.isPending}
        >
          {isFollowing ? (
            <>
              <UserCheck className="w-3.5 h-3.5" />
              Following
            </>
          ) : (
            <>
              <UserPlus className="w-3.5 h-3.5" />
              Follow
            </>
          )}
        </Button>
      </div>
    </Link>
  );
};

interface Props {
  users: SuggestedUser[];
  startIndex?: number;
}

const SuggestedUsers = ({ users, startIndex = 0 }: Props) => {
  const items = users.slice(startIndex, startIndex + 4);
  if (items.length === 0) return null;

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h3 className="text-[15px] font-semibold text-foreground">
          👥 যাদের চিনতে পারেন
        </h3>
        <Link
          to="/marketplace"
          className="flex items-center gap-0.5 text-xs font-medium text-primary hover:underline"
        >
          সব দেখুন <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="flex gap-3 px-4 pb-4 overflow-x-auto scrollbar-hide">
        {items.map((u) => (
          <SuggestedUserCard key={u.user_id} profile={u} />
        ))}
      </div>
    </div>
  );
};

export default SuggestedUsers;

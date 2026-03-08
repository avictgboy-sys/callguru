
-- BATCH 1: likes, comments, follows, posts, profiles, ad_views, badges, points_redemptions

-- likes
DROP POLICY IF EXISTS "Likes are viewable by everyone" ON public.likes;
DROP POLICY IF EXISTS "Users can like posts" ON public.likes;
DROP POLICY IF EXISTS "Users can unlike posts" ON public.likes;
CREATE POLICY "Likes are viewable by everyone" ON public.likes AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Users can like posts" ON public.likes AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike posts" ON public.likes AS PERMISSIVE FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- comments
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
DROP POLICY IF EXISTS "Users can create comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;
DROP POLICY IF EXISTS "Admins can delete any comment" ON public.comments;
CREATE POLICY "Comments are viewable by everyone" ON public.comments AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Users can create comments" ON public.comments AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON public.comments AS PERMISSIVE FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can delete any comment" ON public.comments AS PERMISSIVE FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- follows
DROP POLICY IF EXISTS "Follows are viewable by everyone" ON public.follows;
DROP POLICY IF EXISTS "Users can follow others" ON public.follows;
DROP POLICY IF EXISTS "Users can unfollow" ON public.follows;
CREATE POLICY "Follows are viewable by everyone" ON public.follows AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Users can follow others" ON public.follows AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = follower_id) AND (follower_id <> following_id));
CREATE POLICY "Users can unfollow" ON public.follows AS PERMISSIVE FOR DELETE TO authenticated USING (auth.uid() = follower_id);

-- posts
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;
DROP POLICY IF EXISTS "Users can create their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON public.posts;
DROP POLICY IF EXISTS "Admins can update any post" ON public.posts;
DROP POLICY IF EXISTS "Admins can delete any post" ON public.posts;
DROP POLICY IF EXISTS "Super admins manage all posts" ON public.posts;
CREATE POLICY "Posts are viewable by everyone" ON public.posts AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Users can create their own posts" ON public.posts AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own posts" ON public.posts AS PERMISSIVE FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own posts" ON public.posts AS PERMISSIVE FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can update any post" ON public.posts AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete any post" ON public.posts AS PERMISSIVE FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Super admins manage all posts" ON public.posts AS PERMISSIVE FOR ALL TO authenticated USING (has_super_admin(auth.uid())) WITH CHECK (has_super_admin(auth.uid()));

-- profiles
DROP POLICY IF EXISTS "Users can view basic profiles of others" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can manage profiles" ON public.profiles;
CREATE POLICY "Users can view basic profiles of others" ON public.profiles AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles AS PERMISSIVE FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can update any profile" ON public.profiles AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Super admins can manage profiles" ON public.profiles AS PERMISSIVE FOR ALL TO authenticated USING (has_super_admin(auth.uid())) WITH CHECK (has_super_admin(auth.uid()));

-- ad_views
DROP POLICY IF EXISTS "Users can insert own ad views" ON public.ad_views;
DROP POLICY IF EXISTS "Users can view own ad views" ON public.ad_views;
CREATE POLICY "Users can insert own ad views" ON public.ad_views AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own ad views" ON public.ad_views AS PERMISSIVE FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- badges
DROP POLICY IF EXISTS "Badges viewable by everyone" ON public.badges;
CREATE POLICY "Badges viewable by everyone" ON public.badges AS PERMISSIVE FOR SELECT TO public USING (true);

-- points_redemptions
DROP POLICY IF EXISTS "Users can insert own redemptions" ON public.points_redemptions;
DROP POLICY IF EXISTS "Users can view own redemptions" ON public.points_redemptions;
CREATE POLICY "Users can insert own redemptions" ON public.points_redemptions AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own redemptions" ON public.points_redemptions AS PERMISSIVE FOR SELECT TO authenticated USING (auth.uid() = user_id);

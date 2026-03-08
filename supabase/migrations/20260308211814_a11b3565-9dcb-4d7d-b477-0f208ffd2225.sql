
-- Fix comments RLS: Change from RESTRICTIVE to PERMISSIVE
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
DROP POLICY IF EXISTS "Users can create comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;
DROP POLICY IF EXISTS "Admins can delete any comment" ON public.comments;

CREATE POLICY "Comments are viewable by everyone"
ON public.comments AS PERMISSIVE FOR SELECT
TO public
USING (true);

CREATE POLICY "Users can create comments"
ON public.comments AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
ON public.comments AS PERMISSIVE FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any comment"
ON public.comments AS PERMISSIVE FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Fix follows RLS: Change from RESTRICTIVE to PERMISSIVE
DROP POLICY IF EXISTS "Follows are viewable by everyone" ON public.follows;
DROP POLICY IF EXISTS "Users can follow others" ON public.follows;
DROP POLICY IF EXISTS "Users can unfollow" ON public.follows;

CREATE POLICY "Follows are viewable by everyone"
ON public.follows AS PERMISSIVE FOR SELECT
TO public
USING (true);

CREATE POLICY "Users can follow others"
ON public.follows AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = follower_id AND follower_id <> following_id);

CREATE POLICY "Users can unfollow"
ON public.follows AS PERMISSIVE FOR DELETE
TO authenticated
USING (auth.uid() = follower_id);

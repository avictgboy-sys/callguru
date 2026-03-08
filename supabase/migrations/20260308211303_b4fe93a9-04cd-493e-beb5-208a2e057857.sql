
-- Fix likes RLS: Change from RESTRICTIVE to PERMISSIVE
DROP POLICY IF EXISTS "Users can like posts" ON public.likes;
DROP POLICY IF EXISTS "Users can unlike posts" ON public.likes;
DROP POLICY IF EXISTS "Likes are viewable by everyone" ON public.likes;

CREATE POLICY "Likes are viewable by everyone"
ON public.likes FOR SELECT
TO public
USING (true);

CREATE POLICY "Users can like posts"
ON public.likes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts"
ON public.likes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

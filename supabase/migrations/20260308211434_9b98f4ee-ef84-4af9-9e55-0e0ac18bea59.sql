
-- Drop existing RESTRICTIVE likes policies
DROP POLICY IF EXISTS "Likes are viewable by everyone" ON public.likes;
DROP POLICY IF EXISTS "Users can like posts" ON public.likes;
DROP POLICY IF EXISTS "Users can unlike posts" ON public.likes;

-- Recreate as explicitly PERMISSIVE
CREATE POLICY "Likes are viewable by everyone"
ON public.likes AS PERMISSIVE FOR SELECT
TO public
USING (true);

CREATE POLICY "Users can like posts"
ON public.likes AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts"
ON public.likes AS PERMISSIVE FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

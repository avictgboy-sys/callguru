-- Allow reels owner to update their own reels (for views_count increment we'll use a function)
CREATE POLICY "Users can update own reels"
ON public.reels FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Function to increment view count (security definer so anyone can call it)
CREATE OR REPLACE FUNCTION public.increment_reel_views(p_reel_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE reels SET views_count = views_count + 1 WHERE id = p_reel_id;
END;
$$;
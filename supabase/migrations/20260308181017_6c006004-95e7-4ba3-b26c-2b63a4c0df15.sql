
-- Allow users to update their own ads (only when pending)
CREATE POLICY "Users can update own pending ads"
ON public.self_ads
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND status = 'pending')
WITH CHECK (auth.uid() = user_id AND status = 'pending');

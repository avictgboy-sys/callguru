
-- Allow provider to update call status to missed/declined
CREATE POLICY "Providers can update call status"
ON public.calls
FOR UPDATE
TO authenticated
USING (auth.uid() = provider_id)
WITH CHECK (auth.uid() = provider_id);

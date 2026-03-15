
-- Storage RLS policies for call-recordings bucket

-- Allow authenticated users to upload recordings
CREATE POLICY "Users can upload call recordings"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'call-recordings');

-- Allow call participants to view their recordings
CREATE POLICY "Call participants can view recordings"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'call-recordings'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_super_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.calls
      WHERE (calls.caller_id = auth.uid() OR calls.provider_id = auth.uid())
        AND calls.recording_url = name
    )
  )
);

-- Allow admins to delete recordings
CREATE POLICY "Admins can delete recordings"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'call-recordings'
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_super_admin(auth.uid()))
);

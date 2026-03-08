
-- Drop and recreate the conflicting policies
DROP POLICY IF EXISTS "Anyone can view reel videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own reel videos" ON storage.objects;

CREATE POLICY "Anyone can view reel videos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'reel-videos');

CREATE POLICY "Users can delete own reel videos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'reel-videos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Create storage bucket for reel videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('reel-videos', 'reel-videos', true);

-- Allow authenticated users to upload videos
CREATE POLICY "Users can upload reel videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'reel-videos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow anyone to view reel videos (public bucket)
CREATE POLICY "Anyone can view reel videos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'reel-videos');

-- Allow users to delete their own reel videos
CREATE POLICY "Users can delete own reel videos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'reel-videos' AND (storage.foldername(name))[1] = auth.uid()::text);
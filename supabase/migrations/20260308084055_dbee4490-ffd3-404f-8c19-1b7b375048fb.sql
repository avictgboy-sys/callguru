
-- Add recording_url column to calls
ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS recording_url text;

-- Create storage bucket for recordings
INSERT INTO storage.buckets (id, name, public)
VALUES ('call-recordings', 'call-recordings', false)
ON CONFLICT (id) DO NOTHING;

-- RLS for call recordings bucket
CREATE POLICY "Users can upload their own call recordings"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'call-recordings' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can view their own call recordings"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'call-recordings' AND auth.uid() IS NOT NULL
);

-- Enable realtime for calls table (for signaling)
ALTER PUBLICATION supabase_realtime ADD TABLE public.calls;

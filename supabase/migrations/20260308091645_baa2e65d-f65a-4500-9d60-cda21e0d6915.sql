
-- Self-serve ads table
CREATE TABLE public.self_ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ad_type text NOT NULL DEFAULT 'banner',
  title text NOT NULL,
  description text,
  image_url text,
  video_url text,
  link_url text,
  budget numeric NOT NULL DEFAULT 0,
  spent numeric NOT NULL DEFAULT 0,
  impressions integer NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  admin_note text,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.self_ads ENABLE ROW LEVEL SECURITY;

-- Users can view their own ads
CREATE POLICY "Users can view own ads" ON public.self_ads
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Users can create ads
CREATE POLICY "Users can create ads" ON public.self_ads
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all ads
CREATE POLICY "Admins can view all ads" ON public.self_ads
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update ads
CREATE POLICY "Admins can update all ads" ON public.self_ads
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Anyone can view active approved ads (for displaying in feed)
CREATE POLICY "Anyone can view active ads" ON public.self_ads
  FOR SELECT
  USING (status = 'active');

-- Storage bucket for ad media
INSERT INTO storage.buckets (id, name, public) VALUES ('ad-media', 'ad-media', true);

-- Storage policies for ad-media
CREATE POLICY "Users can upload ad media" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'ad-media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view ad media" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'ad-media');

-- Add ad pricing setting
INSERT INTO app_settings (key, value, description)
VALUES ('ad_cost_per_1000', '50', 'Cost per 1000 impressions (৳) for self-serve ads')
ON CONFLICT (key) DO NOTHING;

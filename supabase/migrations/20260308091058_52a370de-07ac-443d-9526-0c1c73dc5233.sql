
-- Ad views tracking table to prevent duplicate point awards
CREATE TABLE public.ad_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ad_slot text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.ad_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own ad views" ON public.ad_views
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own ad views" ON public.ad_views
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Create index for rate limiting lookups
CREATE INDEX idx_ad_views_user_date ON public.ad_views (user_id, created_at);

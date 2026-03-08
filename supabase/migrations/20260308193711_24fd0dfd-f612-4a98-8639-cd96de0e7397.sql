
CREATE TABLE public.live_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  stream_url text NOT NULL,
  category text DEFAULT 'general',
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.live_channels ENABLE ROW LEVEL SECURITY;

-- Everyone can view active channels
CREATE POLICY "Active channels viewable by everyone" ON public.live_channels
  FOR SELECT USING (is_active = true);

-- Admins can manage all channels
CREATE POLICY "Admins manage channels" ON public.live_channels
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Super admins manage all channels
CREATE POLICY "Super admins manage channels" ON public.live_channels
  FOR ALL USING (has_super_admin(auth.uid()));

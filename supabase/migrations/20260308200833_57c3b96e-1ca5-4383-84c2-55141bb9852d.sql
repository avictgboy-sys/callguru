
CREATE TABLE public.m3u_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_imported_at TIMESTAMP WITH TIME ZONE,
  channel_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.m3u_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage m3u_sources" ON public.m3u_sources
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Super admins manage m3u_sources" ON public.m3u_sources
  FOR ALL TO authenticated
  USING (has_super_admin(auth.uid()));

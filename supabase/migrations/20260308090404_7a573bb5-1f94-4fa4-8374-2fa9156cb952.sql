
-- Disputes table
CREATE TABLE public.disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id uuid NOT NULL REFERENCES public.calls(id) ON DELETE CASCADE,
  complainant_id uuid NOT NULL,
  against_id uuid NOT NULL,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'open',
  admin_note text,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

-- Users can view their own disputes
CREATE POLICY "Users can view own disputes" ON public.disputes
  FOR SELECT TO authenticated
  USING (auth.uid() = complainant_id OR auth.uid() = against_id);

-- Users can create disputes for their own calls
CREATE POLICY "Users can create disputes" ON public.disputes
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = complainant_id);

-- Admins can view all disputes
CREATE POLICY "Admins can view all disputes" ON public.disputes
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update disputes
CREATE POLICY "Admins can update disputes" ON public.disputes
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

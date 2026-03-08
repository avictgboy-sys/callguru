
CREATE TABLE public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  description text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read settings
CREATE POLICY "Settings are viewable by everyone"
  ON public.app_settings FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can modify
CREATE POLICY "Admins can manage settings"
  ON public.app_settings FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Seed default merchant numbers
INSERT INTO public.app_settings (key, value, description) VALUES
  ('merchant_bkash', '01XXXXXXXXX', 'bKash merchant number'),
  ('merchant_nagad', '01XXXXXXXXX', 'Nagad merchant number'),
  ('merchant_rocket', '01XXXXXXXXXXX', 'Rocket merchant number'),
  ('bank_name', '', 'Bank name for transfers'),
  ('bank_account_name', '', 'Bank account holder name'),
  ('bank_account_number', '', 'Bank account number'),
  ('bank_branch', '', 'Bank branch name'),
  ('bank_routing', '', 'Bank routing number');

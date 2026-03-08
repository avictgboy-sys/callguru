
-- Badges table
CREATE TABLE public.badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text NOT NULL DEFAULT '🏅',
  points_required integer NOT NULL DEFAULT 0,
  badge_type text NOT NULL DEFAULT 'points',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Badges viewable by everyone" ON public.badges
  FOR SELECT USING (true);

-- User badges (unlocked)
CREATE TABLE public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  badge_id uuid NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  unlocked_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own badges" ON public.user_badges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own badges" ON public.user_badges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view badges" ON public.user_badges
  FOR SELECT USING (true);

-- Points redemption log
CREATE TABLE public.points_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  points_spent integer NOT NULL,
  value numeric,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.points_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own redemptions" ON public.points_redemptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own redemptions" ON public.points_redemptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Seed default badges
INSERT INTO public.badges (name, description, icon, points_required, badge_type) VALUES
  ('Newcomer', 'Welcome to CallGuru!', '👋', 0, 'points'),
  ('Active Viewer', 'Earned 50 points from ads', '👀', 50, 'points'),
  ('Ad Champion', 'Earned 200 points from ads', '🏆', 200, 'points'),
  ('Super Fan', 'Earned 500 points', '⭐', 500, 'points'),
  ('Legend', 'Earned 1000 points', '🔥', 1000, 'points'),
  ('Elite', 'Earned 5000 points', '💎', 5000, 'points');

-- Add points_to_taka_rate setting
INSERT INTO public.app_settings (key, value, description) VALUES
  ('points_to_taka_rate', '10', 'How many points = ৳1')
ON CONFLICT (key) DO NOTHING;

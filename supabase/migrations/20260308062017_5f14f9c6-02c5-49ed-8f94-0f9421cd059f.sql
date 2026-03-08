-- Service categories table
CREATE TABLE public.service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are viewable by everyone"
  ON public.service_categories FOR SELECT USING (true);

-- Seed default categories
INSERT INTO public.service_categories (name, slug, icon, sort_order) VALUES
  ('Education & Learning', 'education', 'GraduationCap', 1),
  ('Professional Consultation', 'professional', 'Briefcase', 2),
  ('Tech Support', 'tech-support', 'Monitor', 3),
  ('Personal Advice', 'personal-advice', 'Heart', 4),
  ('Health & Fitness', 'health-fitness', 'Dumbbell', 5),
  ('Spiritual / Astrology', 'spiritual', 'Sparkles', 6),
  ('Creative Skills', 'creative', 'Palette', 7),
  ('Language Learning', 'language', 'Languages', 8),
  ('Freelancing Help', 'freelancing', 'Lightbulb', 9),
  ('Others', 'others', 'MoreHorizontal', 10);

-- Services table (provider listings)
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.service_categories(id),
  title TEXT NOT NULL,
  description TEXT,
  price_per_minute NUMERIC NOT NULL CHECK (price_per_minute > 0),
  rating NUMERIC DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  total_reviews INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT TRUE,
  availability_schedule JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Services are viewable by everyone"
  ON public.services FOR SELECT USING (is_active = true);

CREATE POLICY "Providers can insert their own services"
  ON public.services FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Providers can update their own services"
  ON public.services FOR UPDATE
  TO authenticated
  USING (auth.uid() = provider_id);

CREATE POLICY "Providers can delete their own services"
  ON public.services FOR DELETE
  TO authenticated
  USING (auth.uid() = provider_id);

CREATE INDEX idx_services_category ON public.services(category_id);
CREATE INDEX idx_services_provider ON public.services(provider_id);
CREATE INDEX idx_services_available ON public.services(is_available, is_active);

CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
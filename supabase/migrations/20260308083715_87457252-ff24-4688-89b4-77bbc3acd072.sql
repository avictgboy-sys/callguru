
-- Reviews table
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id uuid NOT NULL REFERENCES public.calls(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL,
  provider_id uuid NOT NULL,
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  rating integer NOT NULL,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (call_id, reviewer_id)
);

-- Validation trigger instead of CHECK
CREATE OR REPLACE FUNCTION public.validate_review_rating()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_review_rating
BEFORE INSERT OR UPDATE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.validate_review_rating();

-- RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are viewable by everyone"
ON public.reviews FOR SELECT
USING (true);

CREATE POLICY "Users can create their own reviews"
ON public.reviews FOR INSERT
WITH CHECK (auth.uid() = reviewer_id);

-- Trigger to update service rating aggregates
CREATE OR REPLACE FUNCTION public.update_service_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE services SET
    rating = (SELECT ROUND(AVG(rating)::numeric, 2) FROM reviews WHERE service_id = NEW.service_id),
    total_reviews = (SELECT COUNT(*) FROM reviews WHERE service_id = NEW.service_id)
  WHERE id = NEW.service_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_service_rating
AFTER INSERT ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.update_service_rating();

-- Notify provider when they receive a review
CREATE OR REPLACE FUNCTION public.notify_on_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  actor_name text;
BEGIN
  SELECT COALESCE(full_name, 'Someone') INTO actor_name FROM profiles WHERE user_id = NEW.reviewer_id;
  INSERT INTO notifications (user_id, type, title, body, actor_id, resource_id)
  VALUES (NEW.provider_id, 'review', actor_name || ' left a ' || NEW.rating || '-star review',
    COALESCE(LEFT(NEW.comment, 100), ''), NEW.reviewer_id, NEW.service_id::text);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_on_review
AFTER INSERT ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.notify_on_review();

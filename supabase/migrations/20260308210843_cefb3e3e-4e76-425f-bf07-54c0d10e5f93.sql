
CREATE OR REPLACE FUNCTION public.increment_ad_points(p_user_id uuid, p_ad_slot text, p_points integer, p_daily_limit integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_today_count integer;
BEGIN
  -- Check daily limit
  SELECT COUNT(*) INTO v_today_count
  FROM ad_views
  WHERE user_id = p_user_id
    AND created_at >= date_trunc('day', now());

  IF v_today_count >= p_daily_limit THEN
    RETURN false;
  END IF;

  -- Record view
  INSERT INTO ad_views (user_id, ad_slot) VALUES (p_user_id, p_ad_slot);

  -- Atomic increment points
  UPDATE profiles SET points = COALESCE(points, 0) + p_points WHERE user_id = p_user_id;

  RETURN true;
END;
$$;

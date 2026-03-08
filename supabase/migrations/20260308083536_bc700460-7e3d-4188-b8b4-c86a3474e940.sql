
-- Replace handle_new_user to also process referral codes from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_referral_code text;
  v_referrer_id uuid;
  v_bonus_points numeric;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, full_name, avatar_url, referral_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    'CG-' || SUBSTRING(NEW.id::text FROM 1 FOR 8)
  );

  -- Assign default role
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');

  -- Process referral code if provided
  v_referral_code := NEW.raw_user_meta_data->>'referral_code';
  IF v_referral_code IS NOT NULL AND v_referral_code != '' THEN
    -- Find the referrer
    SELECT user_id INTO v_referrer_id
    FROM profiles
    WHERE referral_code = v_referral_code AND user_id != NEW.id;

    IF v_referrer_id IS NOT NULL THEN
      -- Get configurable bonus points (default 50)
      SELECT COALESCE(
        (SELECT value::numeric FROM app_settings WHERE key = 'referral_bonus_points'),
        50
      ) INTO v_bonus_points;

      -- Update new user's referred_by
      UPDATE profiles SET referred_by = v_referral_code WHERE user_id = NEW.id;

      -- Award points to referrer
      UPDATE profiles SET points = COALESCE(points, 0) + v_bonus_points WHERE user_id = v_referrer_id;

      -- Award points to new user too
      UPDATE profiles SET points = COALESCE(points, 0) + v_bonus_points WHERE user_id = NEW.id;

      -- Notify referrer
      INSERT INTO notifications (user_id, type, title, body, actor_id)
      VALUES (
        v_referrer_id, 'referral',
        'Referral bonus earned!',
        'You earned ' || v_bonus_points || ' points for referring a new user.',
        NEW.id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

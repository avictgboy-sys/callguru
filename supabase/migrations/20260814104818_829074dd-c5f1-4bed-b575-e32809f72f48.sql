-- 1. Public-safe profile view (bypasses profiles RLS, exposes only non-sensitive columns)
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public
WITH (security_invoker = off) AS
SELECT id, user_id, full_name, avatar_url, bio, is_verified,
       followers_count, following_count, created_at
FROM public.profiles;

GRANT SELECT ON public.profiles_public TO anon, authenticated;
GRANT ALL ON public.profiles_public TO service_role;

-- 2. Restrict base table reads
DROP POLICY IF EXISTS "Users can view basic profiles of others" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin') OR has_super_admin(auth.uid()));

-- 3. Allow trusted server-side functions to move wallet/points
CREATE OR REPLACE FUNCTION public.prevent_direct_wallet_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF coalesce(current_setting('app.wallet_ctx', true), '') = 'on' THEN
    RETURN NEW;
  END IF;

  IF NEW.wallet_balance IS DISTINCT FROM OLD.wallet_balance THEN
    IF NOT (has_role(auth.uid(), 'admin') OR has_super_admin(auth.uid())) THEN
      NEW.wallet_balance := OLD.wallet_balance;
    END IF;
  END IF;

  IF NEW.points IS DISTINCT FROM OLD.points THEN
    IF NOT (has_role(auth.uid(), 'admin') OR has_super_admin(auth.uid())) THEN
      NEW.points := OLD.points;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- 4. Atomic ad spend
CREATE OR REPLACE FUNCTION public.spend_wallet_for_ad(p_amount numeric, p_description text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user uuid := auth.uid();
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  PERFORM set_config('app.wallet_ctx', 'on', true);

  UPDATE profiles
  SET wallet_balance = COALESCE(wallet_balance, 0) - p_amount
  WHERE user_id = v_user AND COALESCE(wallet_balance, 0) >= p_amount;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  INSERT INTO wallet_transactions (user_id, type, amount, description)
  VALUES (v_user, 'spending', p_amount, COALESCE(p_description, 'Ad campaign'));

  PERFORM set_config('app.wallet_ctx', 'off', true);
END;
$function$;

-- 5. Atomic points -> wallet conversion
CREATE OR REPLACE FUNCTION public.convert_points_to_wallet(p_points integer, p_rate numeric)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_value numeric;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  IF p_points IS NULL OR p_points <= 0 THEN
    RAISE EXCEPTION 'Points must be positive';
  END IF;
  IF p_rate IS NULL OR p_rate <= 0 THEN
    RAISE EXCEPTION 'Invalid conversion rate';
  END IF;

  v_value := ROUND(p_points::numeric / p_rate, 2);

  PERFORM set_config('app.wallet_ctx', 'on', true);

  UPDATE profiles
  SET points = COALESCE(points, 0) - p_points,
      wallet_balance = COALESCE(wallet_balance, 0) + v_value
  WHERE user_id = v_user AND COALESCE(points, 0) >= p_points;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient points';
  END IF;

  INSERT INTO points_redemptions (user_id, type, points_spent, value, description)
  VALUES (v_user, 'wallet_convert', p_points, v_value,
    'Converted ' || p_points || ' points to ' || v_value);

  INSERT INTO wallet_transactions (user_id, type, amount, description)
  VALUES (v_user, 'topup', v_value, 'Points conversion: ' || p_points || ' pts');

  PERFORM set_config('app.wallet_ctx', 'off', true);

  RETURN v_value;
END;
$function$;

REVOKE ALL ON FUNCTION public.spend_wallet_for_ad(numeric, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.convert_points_to_wallet(integer, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.spend_wallet_for_ad(numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.convert_points_to_wallet(integer, numeric) TO authenticated;
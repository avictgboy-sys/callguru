
-- Calls table to track consultation sessions
CREATE TABLE public.calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caller_id uuid NOT NULL,
  provider_id uuid NOT NULL,
  service_id uuid REFERENCES public.services(id) NOT NULL,
  price_per_minute numeric NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  duration_minutes numeric,
  total_cost numeric,
  platform_fee numeric,
  provider_earning numeric,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;

-- Users can view their own calls (as caller or provider)
CREATE POLICY "Users can view own calls"
  ON public.calls FOR SELECT TO authenticated
  USING (auth.uid() = caller_id OR auth.uid() = provider_id);

-- System inserts calls (via function)
CREATE POLICY "Users can start calls"
  ON public.calls FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = caller_id);

-- Admins can view all calls
CREATE POLICY "Admins can view all calls"
  ON public.calls FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Function to complete a call and handle billing with platform fee
CREATE OR REPLACE FUNCTION public.complete_call(
  p_call_id uuid,
  p_duration_minutes numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_call record;
  v_fee_percent numeric;
  v_total_cost numeric;
  v_platform_fee numeric;
  v_provider_earning numeric;
  v_caller_balance numeric;
BEGIN
  -- Get call details
  SELECT * INTO v_call FROM calls WHERE id = p_call_id AND status = 'active';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Call not found or already completed';
  END IF;

  -- Only caller or provider can end the call
  IF auth.uid() != v_call.caller_id AND auth.uid() != v_call.provider_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Get platform fee percentage from settings (default 1%)
  SELECT COALESCE(
    (SELECT value::numeric FROM app_settings WHERE key = 'call_fee_percent'),
    1
  ) INTO v_fee_percent;

  -- Calculate costs
  v_total_cost := p_duration_minutes * v_call.price_per_minute;
  v_platform_fee := ROUND(v_total_cost * v_fee_percent / 100, 2);
  v_provider_earning := v_total_cost - v_platform_fee;

  -- Check caller balance
  SELECT COALESCE(wallet_balance, 0) INTO v_caller_balance
  FROM profiles WHERE user_id = v_call.caller_id;

  IF v_caller_balance < v_total_cost THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- Deduct from caller
  UPDATE profiles SET wallet_balance = wallet_balance - v_total_cost
  WHERE user_id = v_call.caller_id;

  -- Credit provider (minus fee)
  UPDATE profiles SET wallet_balance = COALESCE(wallet_balance, 0) + v_provider_earning
  WHERE user_id = v_call.provider_id;

  -- Update call record
  UPDATE calls SET
    ended_at = now(),
    duration_minutes = p_duration_minutes,
    total_cost = v_total_cost,
    platform_fee = v_platform_fee,
    provider_earning = v_provider_earning,
    status = 'completed'
  WHERE id = p_call_id;

  -- Record transactions
  INSERT INTO wallet_transactions (user_id, type, amount, description)
  VALUES (v_call.caller_id, 'spending', v_total_cost,
    'Call session (' || p_duration_minutes || ' min)');

  INSERT INTO wallet_transactions (user_id, type, amount, description)
  VALUES (v_call.provider_id, 'earning', v_provider_earning,
    'Call earning (' || p_duration_minutes || ' min, ' || v_fee_percent || '% fee deducted)');

  -- Notify both parties
  INSERT INTO notifications (user_id, type, title, body) VALUES
    (v_call.caller_id, 'call', 'Call completed',
      '৳' || v_total_cost || ' deducted for ' || p_duration_minutes || ' min call'),
    (v_call.provider_id, 'call', 'Call earning received',
      '৳' || v_provider_earning || ' earned (' || v_fee_percent || '% platform fee: ৳' || v_platform_fee || ')');

  -- Update service stats
  UPDATE services SET total_sessions = COALESCE(total_sessions, 0) + 1
  WHERE id = v_call.service_id;
END;
$$;


CREATE OR REPLACE FUNCTION public.approve_payment_request(p_request_id uuid, p_admin_note text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  req record;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  SELECT * INTO req FROM payment_requests WHERE id = p_request_id AND status = 'pending';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment request not found or already processed';
  END IF;
  UPDATE payment_requests SET status = 'completed', admin_note = p_admin_note, updated_at = now() WHERE id = p_request_id;
  IF req.type = 'topup' THEN
    UPDATE profiles SET wallet_balance = COALESCE(wallet_balance, 0) + req.amount WHERE user_id = req.user_id;
    INSERT INTO wallet_transactions (user_id, type, amount, description)
    VALUES (req.user_id, 'topup', req.amount, 'Top-up via ' || req.method);
  END IF;
  INSERT INTO notifications (user_id, type, title, body)
  VALUES (req.user_id, 'payment', 'Payment ' || req.type || ' approved', 
    CASE req.type WHEN 'topup' THEN '৳' || req.amount || ' added to wallet' ELSE 'Withdrawal of ৳' || req.amount || ' approved' END);
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_payment_request(p_request_id uuid, p_admin_note text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  req record;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  SELECT * INTO req FROM payment_requests WHERE id = p_request_id AND status = 'pending';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment request not found or already processed';
  END IF;
  UPDATE payment_requests SET status = 'rejected', admin_note = p_admin_note, updated_at = now() WHERE id = p_request_id;
  IF req.type = 'withdraw' THEN
    UPDATE profiles SET wallet_balance = COALESCE(wallet_balance, 0) + req.amount WHERE user_id = req.user_id;
    INSERT INTO wallet_transactions (user_id, type, amount, description)
    VALUES (req.user_id, 'topup', req.amount, 'Refund: withdrawal rejected');
  END IF;
  INSERT INTO notifications (user_id, type, title, body)
  VALUES (req.user_id, 'payment', 'Payment ' || req.type || ' rejected', 
    COALESCE(p_admin_note, 'Your ' || req.type || ' request was rejected'));
END;
$$;

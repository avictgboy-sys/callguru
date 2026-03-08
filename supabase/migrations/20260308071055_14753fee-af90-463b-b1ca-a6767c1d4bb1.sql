
-- Create wallet transactions table
CREATE TABLE public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('topup', 'withdraw', 'earning', 'spending')),
  amount numeric NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions"
  ON public.wallet_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own transactions
CREATE POLICY "Users can insert own transactions"
  ON public.wallet_transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all transactions
CREATE POLICY "Admins can view all transactions"
  ON public.wallet_transactions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Function to handle top-up (update balance + insert transaction atomically)
CREATE OR REPLACE FUNCTION public.wallet_topup(p_amount numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;
  
  UPDATE profiles SET wallet_balance = COALESCE(wallet_balance, 0) + p_amount WHERE user_id = auth.uid();
  
  INSERT INTO wallet_transactions (user_id, type, amount, description)
  VALUES (auth.uid(), 'topup', p_amount, 'Wallet top-up');
END;
$$;

-- Function to handle withdrawal
CREATE OR REPLACE FUNCTION public.wallet_withdraw(p_amount numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_balance numeric;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;
  
  SELECT COALESCE(wallet_balance, 0) INTO current_balance
  FROM profiles WHERE user_id = auth.uid();
  
  IF current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;
  
  UPDATE profiles SET wallet_balance = wallet_balance - p_amount WHERE user_id = auth.uid();
  
  INSERT INTO wallet_transactions (user_id, type, amount, description)
  VALUES (auth.uid(), 'withdraw', p_amount, 'Wallet withdrawal');
END;
$$;

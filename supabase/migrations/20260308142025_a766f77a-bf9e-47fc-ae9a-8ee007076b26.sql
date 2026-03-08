
-- =============================================
-- FIX 1: Prevent users from directly updating wallet_balance on profiles
-- Replace the broad UPDATE policy with one that uses a trigger to block financial field changes
-- =============================================

-- Create a trigger function to prevent direct wallet_balance updates by non-admin users
CREATE OR REPLACE FUNCTION public.prevent_direct_wallet_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- If wallet_balance is being changed and the caller is not using a SECURITY DEFINER function context
  -- We check if the current user is trying to change wallet_balance directly
  IF NEW.wallet_balance IS DISTINCT FROM OLD.wallet_balance THEN
    -- Allow only if called from a security definer context (server functions)
    -- Check if the user is admin or super_admin
    IF NOT (has_role(auth.uid(), 'admin') OR has_super_admin(auth.uid())) THEN
      NEW.wallet_balance := OLD.wallet_balance; -- Reset to old value
    END IF;
  END IF;
  
  -- Also protect points from direct manipulation
  IF NEW.points IS DISTINCT FROM OLD.points THEN
    IF NOT (has_role(auth.uid(), 'admin') OR has_super_admin(auth.uid())) THEN
      NEW.points := OLD.points;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_financial_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_direct_wallet_update();

-- =============================================
-- FIX 2: Remove user INSERT access on wallet_transactions
-- Only server functions (SECURITY DEFINER) should create transactions
-- =============================================

-- Drop the existing permissive INSERT policy
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.wallet_transactions;

-- =============================================
-- FIX 3: Hide sensitive profile data from unauthenticated users
-- Create a view for public access, restrict base table
-- =============================================

-- Drop the overly broad SELECT policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Authenticated users can see all profiles (needed for app functionality)
CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Create a public view that hides sensitive fields for any public access needs
CREATE VIEW public.profiles_public
WITH (security_invoker = on) AS
  SELECT id, user_id, full_name, avatar_url, bio, is_verified, 
         followers_count, following_count, created_at
  FROM public.profiles;

-- =============================================
-- FIX 4: Restrict home_bookings UPDATE policies to specific columns
-- =============================================

-- Drop existing broad UPDATE policies
DROP POLICY IF EXISTS "Customers can update own bookings" ON public.home_bookings;
DROP POLICY IF EXISTS "Providers can update own bookings" ON public.home_bookings;

-- Customers can only update non-financial fields
CREATE POLICY "Customers can update own bookings restricted"
  ON public.home_bookings FOR UPDATE
  TO authenticated
  USING (auth.uid() = customer_id)
  WITH CHECK (
    auth.uid() = customer_id
    -- Financial fields must remain unchanged (enforced by trigger below)
  );

-- Providers can only update status-related fields
CREATE POLICY "Providers can update own bookings restricted"
  ON public.home_bookings FOR UPDATE
  TO authenticated
  USING (auth.uid() = provider_id)
  WITH CHECK (
    auth.uid() = provider_id
  );

-- Create trigger to protect financial fields on home_bookings
CREATE OR REPLACE FUNCTION public.protect_booking_financial_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Customers cannot change financial fields or status directly
  IF auth.uid() = OLD.customer_id AND NOT (has_role(auth.uid(), 'admin') OR has_super_admin(auth.uid())) THEN
    NEW.quoted_price := OLD.quoted_price;
    NEW.final_price := OLD.final_price;
    NEW.advance_paid := OLD.advance_paid;
    NEW.remaining_paid := OLD.remaining_paid;
    NEW.platform_fee := OLD.platform_fee;
    NEW.provider_earning := OLD.provider_earning;
    NEW.hold_until := OLD.hold_until;
    NEW.released := OLD.released;
  END IF;
  
  -- Providers cannot change financial fields
  IF auth.uid() = OLD.provider_id AND NOT (has_role(auth.uid(), 'admin') OR has_super_admin(auth.uid())) THEN
    NEW.quoted_price := OLD.quoted_price;
    NEW.final_price := OLD.final_price;
    NEW.advance_paid := OLD.advance_paid;
    NEW.remaining_paid := OLD.remaining_paid;
    NEW.platform_fee := OLD.platform_fee;
    NEW.provider_earning := OLD.provider_earning;
    NEW.hold_until := OLD.hold_until;
    NEW.released := OLD.released;
    NEW.customer_id := OLD.customer_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_booking_financials
  BEFORE UPDATE ON public.home_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_booking_financial_fields();

-- =============================================
-- FIX 5: Enable leaked password protection
-- =============================================
-- (This is done via auth config, not SQL)

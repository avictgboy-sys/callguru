
-- Home service categories
CREATE TABLE public.home_service_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_bn text NOT NULL,
  icon text DEFAULT '🔧',
  slug text NOT NULL UNIQUE,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.home_service_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Home service categories viewable by everyone" ON public.home_service_categories FOR SELECT USING (true);

-- Seed categories
INSERT INTO public.home_service_categories (name, name_bn, icon, slug, sort_order) VALUES
  ('AC/Fridge/Washing Machine', 'এসি/ফ্রিজ/ওয়াশিং মেশিন', '❄️', 'appliance-repair', 1),
  ('Electrician', 'ইলেক্ট্রিশিয়ান', '⚡', 'electrician', 2),
  ('Plumber', 'প্লাম্বার', '🔧', 'plumber', 3),
  ('Painting', 'পেইন্টিং', '🎨', 'painting', 4),
  ('Cleaning', 'ক্লিনিং', '🧹', 'cleaning', 5),
  ('Carpenter', 'কার্পেন্টার', '🪚', 'carpenter', 6),
  ('Welding', 'ওয়েল্ডিং', '🔥', 'welding', 7),
  ('Other', 'অন্যান্য', '🛠️', 'other', 8);

-- Home services (listings by experts)
CREATE TABLE public.home_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL,
  category_id uuid NOT NULL REFERENCES public.home_service_categories(id),
  title text NOT NULL,
  description text,
  pricing_type text NOT NULL DEFAULT 'fixed' CHECK (pricing_type IN ('fixed', 'quote')),
  fixed_price numeric,
  min_price numeric,
  max_price numeric,
  area text,
  is_active boolean DEFAULT true,
  is_available boolean DEFAULT true,
  rating numeric DEFAULT 0,
  total_reviews integer DEFAULT 0,
  total_jobs integer DEFAULT 0,
  tags text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.home_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Home services viewable by everyone" ON public.home_services FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can view all home services" ON public.home_services FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Providers can create home services" ON public.home_services FOR INSERT WITH CHECK (auth.uid() = provider_id);
CREATE POLICY "Providers can update own home services" ON public.home_services FOR UPDATE USING (auth.uid() = provider_id);
CREATE POLICY "Providers can delete own home services" ON public.home_services FOR DELETE USING (auth.uid() = provider_id);
CREATE POLICY "Admins can manage home services" ON public.home_services FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Home bookings
CREATE TABLE public.home_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES public.home_services(id),
  customer_id uuid NOT NULL,
  provider_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled', 'disputed')),
  pricing_type text NOT NULL DEFAULT 'fixed',
  quoted_price numeric,
  final_price numeric,
  advance_paid numeric DEFAULT 0,
  remaining_paid numeric DEFAULT 0,
  platform_fee numeric DEFAULT 0,
  provider_earning numeric DEFAULT 0,
  hold_until timestamptz,
  released boolean DEFAULT false,
  problem_description text,
  address text,
  phone text,
  preferred_date date,
  preferred_time text,
  completed_at timestamptz,
  customer_confirmed boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.home_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can create bookings" ON public.home_bookings FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Users can view own bookings" ON public.home_bookings FOR SELECT USING (auth.uid() = customer_id OR auth.uid() = provider_id);
CREATE POLICY "Admins can view all bookings" ON public.home_bookings FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Providers can update own bookings" ON public.home_bookings FOR UPDATE USING (auth.uid() = provider_id);
CREATE POLICY "Customers can update own bookings" ON public.home_bookings FOR UPDATE USING (auth.uid() = customer_id);
CREATE POLICY "Admins can manage bookings" ON public.home_bookings FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Function to complete a home booking with split payment & 3-day hold
CREATE OR REPLACE FUNCTION public.complete_home_booking(p_booking_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_booking record;
  v_fee_percent numeric := 1.5;
  v_total numeric;
  v_fee numeric;
  v_earning numeric;
  v_remaining numeric;
BEGIN
  SELECT * INTO v_booking FROM home_bookings WHERE id = p_booking_id AND status = 'in_progress';
  IF NOT FOUND THEN RAISE EXCEPTION 'Booking not found or not in progress'; END IF;
  IF auth.uid() != v_booking.customer_id THEN RAISE EXCEPTION 'Only customer can confirm completion'; END IF;

  v_total := COALESCE(v_booking.final_price, v_booking.quoted_price);
  v_fee := ROUND(v_total * v_fee_percent / 100, 2);
  v_earning := v_total - v_fee;
  v_remaining := v_total - COALESCE(v_booking.advance_paid, 0);

  -- Deduct remaining from customer
  IF v_remaining > 0 THEN
    UPDATE profiles SET wallet_balance = wallet_balance - v_remaining WHERE user_id = v_booking.customer_id;
    INSERT INTO wallet_transactions (user_id, type, amount, description)
    VALUES (v_booking.customer_id, 'spending', v_remaining, 'Home service remaining payment');
  END IF;

  -- Update booking with 3-day hold
  UPDATE home_bookings SET
    status = 'completed',
    completed_at = now(),
    remaining_paid = v_remaining,
    platform_fee = v_fee,
    provider_earning = v_earning,
    hold_until = now() + interval '3 days',
    released = false,
    customer_confirmed = true,
    updated_at = now()
  WHERE id = p_booking_id;

  -- Update service stats
  UPDATE home_services SET total_jobs = COALESCE(total_jobs, 0) + 1 WHERE id = v_booking.service_id;

  -- Notify provider about 3-day hold
  INSERT INTO notifications (user_id, type, title, body)
  VALUES (v_booking.provider_id, 'payment', 'কাজ সম্পন্ন - পেমেন্ট হোল্ড',
    '৳' || v_earning || ' আপনার জন্য ৩ দিন হোল্ড থাকবে, তারপর ওয়ালেটে যোগ হবে।');
END;
$$;

-- Function to release held payments (to be called by cron/admin)
CREATE OR REPLACE FUNCTION public.release_home_booking_payments()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_booking record;
BEGIN
  FOR v_booking IN
    SELECT * FROM home_bookings
    WHERE status = 'completed' AND released = false AND hold_until <= now()
  LOOP
    UPDATE profiles SET wallet_balance = COALESCE(wallet_balance, 0) + v_booking.provider_earning
    WHERE user_id = v_booking.provider_id;

    INSERT INTO wallet_transactions (user_id, type, amount, description)
    VALUES (v_booking.provider_id, 'earning', v_booking.provider_earning,
      'Home service earning (after 3-day hold)');

    UPDATE home_bookings SET released = true, updated_at = now() WHERE id = v_booking.id;

    INSERT INTO notifications (user_id, type, title, body)
    VALUES (v_booking.provider_id, 'payment', 'পেমেন্ট রিলিজ হয়েছে',
      '৳' || v_booking.provider_earning || ' আপনার ওয়ালেটে যোগ হয়েছে।');
  END LOOP;
END;
$$;

-- Function for advance payment on booking
CREATE OR REPLACE FUNCTION public.pay_home_booking_advance(p_booking_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_booking record;
  v_advance numeric;
  v_balance numeric;
BEGIN
  SELECT * INTO v_booking FROM home_bookings WHERE id = p_booking_id AND status = 'accepted';
  IF NOT FOUND THEN RAISE EXCEPTION 'Booking not found or not accepted'; END IF;
  IF auth.uid() != v_booking.customer_id THEN RAISE EXCEPTION 'Unauthorized'; END IF;

  v_advance := ROUND(COALESCE(v_booking.quoted_price, v_booking.final_price) * 0.5, 2);

  SELECT COALESCE(wallet_balance, 0) INTO v_balance FROM profiles WHERE user_id = v_booking.customer_id;
  IF v_balance < v_advance THEN RAISE EXCEPTION 'Insufficient balance. Need ৳% for advance.', v_advance; END IF;

  UPDATE profiles SET wallet_balance = wallet_balance - v_advance WHERE user_id = v_booking.customer_id;

  INSERT INTO wallet_transactions (user_id, type, amount, description)
  VALUES (v_booking.customer_id, 'spending', v_advance, 'Home service advance (50%)');

  UPDATE home_bookings SET
    advance_paid = v_advance,
    status = 'in_progress',
    updated_at = now()
  WHERE id = p_booking_id;

  INSERT INTO notifications (user_id, type, title, body)
  VALUES (v_booking.provider_id, 'payment', 'অ্যাডভান্স পেমেন্ট পেয়েছেন',
    '৳' || v_advance || ' অ্যাডভান্স পেমেন্ট হয়েছে। কাজ শুরু করুন।');
END;
$$;

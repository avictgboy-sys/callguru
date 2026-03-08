
-- ========== payment_requests ==========
DROP POLICY IF EXISTS "Admins can update payment requests" ON public.payment_requests;
DROP POLICY IF EXISTS "Admins can view all payment requests" ON public.payment_requests;
DROP POLICY IF EXISTS "Super admins view all payments" ON public.payment_requests;
DROP POLICY IF EXISTS "Users can create own payment requests" ON public.payment_requests;
DROP POLICY IF EXISTS "Users can view own payment requests" ON public.payment_requests;

CREATE POLICY "Users can view own payment requests" ON public.payment_requests AS PERMISSIVE FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can create own payment requests" ON public.payment_requests AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can view all payment requests" ON public.payment_requests AS PERMISSIVE FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update payment requests" ON public.payment_requests AS PERMISSIVE FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Super admins view all payments" ON public.payment_requests AS PERMISSIVE FOR ALL TO authenticated USING (public.has_super_admin(auth.uid())) WITH CHECK (public.has_super_admin(auth.uid()));

-- ========== points_redemptions ==========
DROP POLICY IF EXISTS "Users can insert own redemptions" ON public.points_redemptions;
DROP POLICY IF EXISTS "Users can view own redemptions" ON public.points_redemptions;

CREATE POLICY "Users can insert own redemptions" ON public.points_redemptions AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own redemptions" ON public.points_redemptions AS PERMISSIVE FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ========== posts ==========
DROP POLICY IF EXISTS "Admins can delete any post" ON public.posts;
DROP POLICY IF EXISTS "Admins can update any post" ON public.posts;
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;
DROP POLICY IF EXISTS "Super admins manage all posts" ON public.posts;
DROP POLICY IF EXISTS "Users can create their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON public.posts;

CREATE POLICY "Posts are viewable by everyone" ON public.posts AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Users can create their own posts" ON public.posts AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own posts" ON public.posts AS PERMISSIVE FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own posts" ON public.posts AS PERMISSIVE FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can update any post" ON public.posts AS PERMISSIVE FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete any post" ON public.posts AS PERMISSIVE FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Super admins manage all posts" ON public.posts AS PERMISSIVE FOR ALL TO authenticated USING (public.has_super_admin(auth.uid())) WITH CHECK (public.has_super_admin(auth.uid()));

-- ========== profiles ==========
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view basic profiles of others" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own full profile" ON public.profiles;

CREATE POLICY "Users can view basic profiles of others" ON public.profiles AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles AS PERMISSIVE FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can update any profile" ON public.profiles AS PERMISSIVE FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Super admins can manage profiles" ON public.profiles AS PERMISSIVE FOR ALL TO authenticated USING (public.has_super_admin(auth.uid())) WITH CHECK (public.has_super_admin(auth.uid()));

-- ========== push_subscriptions ==========
DROP POLICY IF EXISTS "Service role can read all subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can manage own push subscriptions" ON public.push_subscriptions;

CREATE POLICY "Service role can read all subscriptions" ON public.push_subscriptions AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Users can manage own push subscriptions" ON public.push_subscriptions AS PERMISSIVE FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ========== reel_comments ==========
DROP POLICY IF EXISTS "Reel comments viewable by everyone" ON public.reel_comments;
DROP POLICY IF EXISTS "Users can create reel comments" ON public.reel_comments;
DROP POLICY IF EXISTS "Users can delete own reel comments" ON public.reel_comments;

CREATE POLICY "Reel comments viewable by everyone" ON public.reel_comments AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Users can create reel comments" ON public.reel_comments AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own reel comments" ON public.reel_comments AS PERMISSIVE FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ========== reel_likes ==========
DROP POLICY IF EXISTS "Reel likes viewable by everyone" ON public.reel_likes;
DROP POLICY IF EXISTS "Users can like reels" ON public.reel_likes;
DROP POLICY IF EXISTS "Users can unlike reels" ON public.reel_likes;

CREATE POLICY "Reel likes viewable by everyone" ON public.reel_likes AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Users can like reels" ON public.reel_likes AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike reels" ON public.reel_likes AS PERMISSIVE FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ========== reels ==========
DROP POLICY IF EXISTS "Admins can delete any reel" ON public.reels;
DROP POLICY IF EXISTS "Reels viewable by everyone" ON public.reels;
DROP POLICY IF EXISTS "Users can create own reels" ON public.reels;
DROP POLICY IF EXISTS "Users can delete own reels" ON public.reels;
DROP POLICY IF EXISTS "Users can update own reels" ON public.reels;

CREATE POLICY "Reels viewable by everyone" ON public.reels AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Users can create own reels" ON public.reels AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reels" ON public.reels AS PERMISSIVE FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own reels" ON public.reels AS PERMISSIVE FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can delete any reel" ON public.reels AS PERMISSIVE FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ========== reviews ==========
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.reviews;
DROP POLICY IF EXISTS "Users can create their own reviews" ON public.reviews;

CREATE POLICY "Reviews are viewable by everyone" ON public.reviews AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Users can create their own reviews" ON public.reviews AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = reviewer_id);

-- ========== self_ads ==========
DROP POLICY IF EXISTS "Admins can update all ads" ON public.self_ads;
DROP POLICY IF EXISTS "Admins can view all ads" ON public.self_ads;
DROP POLICY IF EXISTS "Anyone can view active ads" ON public.self_ads;
DROP POLICY IF EXISTS "Users can create ads" ON public.self_ads;
DROP POLICY IF EXISTS "Users can update own pending ads" ON public.self_ads;

CREATE POLICY "Anyone can view active ads" ON public.self_ads AS PERMISSIVE FOR SELECT TO public USING (status = 'active');
CREATE POLICY "Users can create ads" ON public.self_ads AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pending ads" ON public.self_ads AS PERMISSIVE FOR UPDATE TO authenticated USING (auth.uid() = user_id AND status = 'pending') WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all ads" ON public.self_ads AS PERMISSIVE FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update all ads" ON public.self_ads AS PERMISSIVE FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ========== service_categories ==========
-- Check if policies exist first
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'service_categories') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Service categories viewable by everyone" ON public.service_categories';
  END IF;
END $$;
CREATE POLICY "Service categories viewable by everyone" ON public.service_categories AS PERMISSIVE FOR SELECT TO public USING (true);

-- ========== services ==========
DO $$ BEGIN
  EXECUTE 'DROP POLICY IF EXISTS "Services viewable by everyone" ON public.services';
  EXECUTE 'DROP POLICY IF EXISTS "Providers can create services" ON public.services';
  EXECUTE 'DROP POLICY IF EXISTS "Providers can update own services" ON public.services';
  EXECUTE 'DROP POLICY IF EXISTS "Providers can delete own services" ON public.services';
  EXECUTE 'DROP POLICY IF EXISTS "Admins can manage services" ON public.services';
  EXECUTE 'DROP POLICY IF EXISTS "Super admins manage all services" ON public.services';
  EXECUTE 'DROP POLICY IF EXISTS "Active services viewable" ON public.services';
END $$;

CREATE POLICY "Active services viewable" ON public.services AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Providers can create services" ON public.services AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = provider_id);
CREATE POLICY "Providers can update own services" ON public.services AS PERMISSIVE FOR UPDATE TO authenticated USING (auth.uid() = provider_id);
CREATE POLICY "Providers can delete own services" ON public.services AS PERMISSIVE FOR DELETE TO authenticated USING (auth.uid() = provider_id);

-- ========== user_badges ==========
DO $$ BEGIN
  EXECUTE 'DROP POLICY IF EXISTS "Users can view own badges" ON public.user_badges';
  EXECUTE 'DROP POLICY IF EXISTS "User badges viewable" ON public.user_badges';
END $$;
CREATE POLICY "User badges viewable" ON public.user_badges AS PERMISSIVE FOR SELECT TO public USING (true);

-- ========== user_roles ==========
DO $$ BEGIN
  EXECUTE 'DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles';
  EXECUTE 'DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles';
END $$;
CREATE POLICY "Users can view own roles" ON public.user_roles AS PERMISSIVE FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles AS PERMISSIVE FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ========== wallet_transactions ==========
DO $$ BEGIN
  EXECUTE 'DROP POLICY IF EXISTS "Users can view own transactions" ON public.wallet_transactions';
  EXECUTE 'DROP POLICY IF EXISTS "Users can insert own transactions" ON public.wallet_transactions';
  EXECUTE 'DROP POLICY IF EXISTS "Admins can view all transactions" ON public.wallet_transactions';
END $$;
CREATE POLICY "Users can view own transactions" ON public.wallet_transactions AS PERMISSIVE FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON public.wallet_transactions AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

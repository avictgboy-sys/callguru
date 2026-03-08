
-- BATCH 4: disputes, home_services, home_bookings, home_service_categories, live_channels, m3u_sources, payment_requests, wallet_transactions, app_settings, push_subscriptions, self_ads, user_roles, user_badges, service_categories

-- disputes
DROP POLICY IF EXISTS "Users can view own disputes" ON public.disputes;
DROP POLICY IF EXISTS "Users can create disputes" ON public.disputes;
DROP POLICY IF EXISTS "Admins can view all disputes" ON public.disputes;
DROP POLICY IF EXISTS "Admins can update disputes" ON public.disputes;
DROP POLICY IF EXISTS "Super admins manage all disputes" ON public.disputes;
CREATE POLICY "Users can view own disputes" ON public.disputes AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = complainant_id) OR (auth.uid() = against_id));
CREATE POLICY "Users can create disputes" ON public.disputes AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = complainant_id);
CREATE POLICY "Admins can view all disputes" ON public.disputes AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update disputes" ON public.disputes AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Super admins manage all disputes" ON public.disputes AS PERMISSIVE FOR ALL TO authenticated USING (has_super_admin(auth.uid())) WITH CHECK (has_super_admin(auth.uid()));

-- home_services
DROP POLICY IF EXISTS "Home services viewable by everyone" ON public.home_services;
DROP POLICY IF EXISTS "Providers can create home services" ON public.home_services;
DROP POLICY IF EXISTS "Providers can update own home services" ON public.home_services;
DROP POLICY IF EXISTS "Providers can delete own home services" ON public.home_services;
DROP POLICY IF EXISTS "Admins can manage home services" ON public.home_services;
DROP POLICY IF EXISTS "Admins can view all home services" ON public.home_services;
DROP POLICY IF EXISTS "Super admins manage all home_services" ON public.home_services;
CREATE POLICY "Home services viewable by everyone" ON public.home_services AS PERMISSIVE FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Providers can create home services" ON public.home_services AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = provider_id);
CREATE POLICY "Providers can update own home services" ON public.home_services AS PERMISSIVE FOR UPDATE TO authenticated USING (auth.uid() = provider_id);
CREATE POLICY "Providers can delete own home services" ON public.home_services AS PERMISSIVE FOR DELETE TO authenticated USING (auth.uid() = provider_id);
CREATE POLICY "Admins can manage home services" ON public.home_services AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Super admins manage all home_services" ON public.home_services AS PERMISSIVE FOR ALL TO authenticated USING (has_super_admin(auth.uid())) WITH CHECK (has_super_admin(auth.uid()));

-- home_bookings
DROP POLICY IF EXISTS "Users can view own bookings" ON public.home_bookings;
DROP POLICY IF EXISTS "Customers can create bookings" ON public.home_bookings;
DROP POLICY IF EXISTS "Customers can update own bookings restricted" ON public.home_bookings;
DROP POLICY IF EXISTS "Providers can update own bookings restricted" ON public.home_bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.home_bookings;
DROP POLICY IF EXISTS "Admins can manage bookings" ON public.home_bookings;
DROP POLICY IF EXISTS "Super admins manage all home_bookings" ON public.home_bookings;
CREATE POLICY "Users can view own bookings" ON public.home_bookings AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = customer_id) OR (auth.uid() = provider_id));
CREATE POLICY "Customers can create bookings" ON public.home_bookings AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Customers can update own bookings restricted" ON public.home_bookings AS PERMISSIVE FOR UPDATE TO authenticated USING (auth.uid() = customer_id) WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Providers can update own bookings restricted" ON public.home_bookings AS PERMISSIVE FOR UPDATE TO authenticated USING (auth.uid() = provider_id) WITH CHECK (auth.uid() = provider_id);
CREATE POLICY "Admins can manage bookings" ON public.home_bookings AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Super admins manage all home_bookings" ON public.home_bookings AS PERMISSIVE FOR ALL TO authenticated USING (has_super_admin(auth.uid())) WITH CHECK (has_super_admin(auth.uid()));

-- home_service_categories
DROP POLICY IF EXISTS "Home service categories viewable by everyone" ON public.home_service_categories;
CREATE POLICY "Home service categories viewable by everyone" ON public.home_service_categories AS PERMISSIVE FOR SELECT TO public USING (true);

-- live_channels
DROP POLICY IF EXISTS "Active channels viewable by everyone" ON public.live_channels;
DROP POLICY IF EXISTS "Admins manage channels" ON public.live_channels;
DROP POLICY IF EXISTS "Super admins manage channels" ON public.live_channels;
CREATE POLICY "Active channels viewable by everyone" ON public.live_channels AS PERMISSIVE FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Admins manage channels" ON public.live_channels AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Super admins manage channels" ON public.live_channels AS PERMISSIVE FOR ALL TO authenticated USING (has_super_admin(auth.uid())) WITH CHECK (has_super_admin(auth.uid()));

-- m3u_sources
DROP POLICY IF EXISTS "Admins manage m3u_sources" ON public.m3u_sources;
DROP POLICY IF EXISTS "Super admins manage m3u_sources" ON public.m3u_sources;
CREATE POLICY "Admins manage m3u_sources" ON public.m3u_sources AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Super admins manage m3u_sources" ON public.m3u_sources AS PERMISSIVE FOR ALL TO authenticated USING (has_super_admin(auth.uid())) WITH CHECK (has_super_admin(auth.uid()));

-- payment_requests
DROP POLICY IF EXISTS "Users can view own payment requests" ON public.payment_requests;
DROP POLICY IF EXISTS "Users can create own payment requests" ON public.payment_requests;
DROP POLICY IF EXISTS "Admins can view all payment requests" ON public.payment_requests;
DROP POLICY IF EXISTS "Admins can update payment requests" ON public.payment_requests;
DROP POLICY IF EXISTS "Super admins view all payments" ON public.payment_requests;
CREATE POLICY "Users can view own payment requests" ON public.payment_requests AS PERMISSIVE FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can create own payment requests" ON public.payment_requests AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can view all payment requests" ON public.payment_requests AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update payment requests" ON public.payment_requests AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Super admins view all payments" ON public.payment_requests AS PERMISSIVE FOR ALL TO authenticated USING (has_super_admin(auth.uid())) WITH CHECK (has_super_admin(auth.uid()));

-- wallet_transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON public.wallet_transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.wallet_transactions;
CREATE POLICY "Users can view own transactions" ON public.wallet_transactions AS PERMISSIVE FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON public.wallet_transactions AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- app_settings
DROP POLICY IF EXISTS "Settings are viewable by everyone" ON public.app_settings;
DROP POLICY IF EXISTS "Admins can manage settings" ON public.app_settings;
DROP POLICY IF EXISTS "Super admins manage app_settings" ON public.app_settings;
CREATE POLICY "Settings are viewable by everyone" ON public.app_settings AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Admins can manage settings" ON public.app_settings AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Super admins manage app_settings" ON public.app_settings AS PERMISSIVE FOR ALL TO authenticated USING (has_super_admin(auth.uid())) WITH CHECK (has_super_admin(auth.uid()));

-- push_subscriptions
DROP POLICY IF EXISTS "Users can manage own push subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Service role can read all subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can manage own push subscriptions" ON public.push_subscriptions AS PERMISSIVE FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Service role can read all subscriptions" ON public.push_subscriptions AS PERMISSIVE FOR SELECT TO public USING (true);

-- self_ads
DROP POLICY IF EXISTS "Users can view own ads" ON public.self_ads;
DROP POLICY IF EXISTS "Users can create own ads" ON public.self_ads;
DROP POLICY IF EXISTS "Users can update own ads" ON public.self_ads;
DROP POLICY IF EXISTS "Admins can manage all ads" ON public.self_ads;
DROP POLICY IF EXISTS "Super admins manage all self_ads" ON public.self_ads;
CREATE POLICY "Users can view own ads" ON public.self_ads AS PERMISSIVE FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own ads" ON public.self_ads AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ads" ON public.self_ads AS PERMISSIVE FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all ads" ON public.self_ads AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Super admins manage all self_ads" ON public.self_ads AS PERMISSIVE FOR ALL TO authenticated USING (has_super_admin(auth.uid())) WITH CHECK (has_super_admin(auth.uid()));

-- user_roles (read-only for users)
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins manage roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles AS PERMISSIVE FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Super admins manage roles" ON public.user_roles AS PERMISSIVE FOR ALL TO authenticated USING (has_super_admin(auth.uid())) WITH CHECK (has_super_admin(auth.uid()));

-- user_badges
DROP POLICY IF EXISTS "Users can view own badges" ON public.user_badges;
DROP POLICY IF EXISTS "User badges viewable" ON public.user_badges;
CREATE POLICY "User badges viewable" ON public.user_badges AS PERMISSIVE FOR SELECT TO public USING (true);

-- service_categories
DROP POLICY IF EXISTS "Service categories viewable" ON public.service_categories;
CREATE POLICY "Service categories viewable" ON public.service_categories AS PERMISSIVE FOR SELECT TO public USING (true);

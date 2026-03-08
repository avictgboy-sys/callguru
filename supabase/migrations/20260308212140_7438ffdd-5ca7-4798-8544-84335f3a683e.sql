
-- ========== home_bookings ==========
DROP POLICY IF EXISTS "Admins can manage bookings" ON public.home_bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.home_bookings;
DROP POLICY IF EXISTS "Customers can create bookings" ON public.home_bookings;
DROP POLICY IF EXISTS "Customers can update own bookings restricted" ON public.home_bookings;
DROP POLICY IF EXISTS "Providers can update own bookings restricted" ON public.home_bookings;
DROP POLICY IF EXISTS "Super admins manage all home_bookings" ON public.home_bookings;
DROP POLICY IF EXISTS "Users can view own bookings" ON public.home_bookings;

CREATE POLICY "Users can view own bookings" ON public.home_bookings AS PERMISSIVE FOR SELECT TO authenticated USING (auth.uid() = customer_id OR auth.uid() = provider_id);
CREATE POLICY "Customers can create bookings" ON public.home_bookings AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Customers can update own bookings restricted" ON public.home_bookings AS PERMISSIVE FOR UPDATE TO authenticated USING (auth.uid() = customer_id) WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Providers can update own bookings restricted" ON public.home_bookings AS PERMISSIVE FOR UPDATE TO authenticated USING (auth.uid() = provider_id) WITH CHECK (auth.uid() = provider_id);
CREATE POLICY "Admins can view all bookings" ON public.home_bookings AS PERMISSIVE FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage bookings" ON public.home_bookings AS PERMISSIVE FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Super admins manage all home_bookings" ON public.home_bookings AS PERMISSIVE FOR ALL TO authenticated USING (public.has_super_admin(auth.uid())) WITH CHECK (public.has_super_admin(auth.uid()));

-- ========== home_service_categories ==========
DROP POLICY IF EXISTS "Home service categories viewable by everyone" ON public.home_service_categories;
CREATE POLICY "Home service categories viewable by everyone" ON public.home_service_categories AS PERMISSIVE FOR SELECT TO public USING (true);

-- ========== home_services ==========
DROP POLICY IF EXISTS "Admins can manage home services" ON public.home_services;
DROP POLICY IF EXISTS "Admins can view all home services" ON public.home_services;
DROP POLICY IF EXISTS "Home services viewable by everyone" ON public.home_services;
DROP POLICY IF EXISTS "Providers can create home services" ON public.home_services;
DROP POLICY IF EXISTS "Providers can delete own home services" ON public.home_services;
DROP POLICY IF EXISTS "Providers can update own home services" ON public.home_services;
DROP POLICY IF EXISTS "Super admins manage all home_services" ON public.home_services;

CREATE POLICY "Home services viewable by everyone" ON public.home_services AS PERMISSIVE FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Providers can create home services" ON public.home_services AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = provider_id);
CREATE POLICY "Providers can update own home services" ON public.home_services AS PERMISSIVE FOR UPDATE TO authenticated USING (auth.uid() = provider_id);
CREATE POLICY "Providers can delete own home services" ON public.home_services AS PERMISSIVE FOR DELETE TO authenticated USING (auth.uid() = provider_id);
CREATE POLICY "Admins can view all home services" ON public.home_services AS PERMISSIVE FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage home services" ON public.home_services AS PERMISSIVE FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Super admins manage all home_services" ON public.home_services AS PERMISSIVE FOR ALL TO authenticated USING (public.has_super_admin(auth.uid())) WITH CHECK (public.has_super_admin(auth.uid()));

-- ========== live_channels ==========
DROP POLICY IF EXISTS "Active channels viewable by everyone" ON public.live_channels;
DROP POLICY IF EXISTS "Admins manage channels" ON public.live_channels;
DROP POLICY IF EXISTS "Super admins manage channels" ON public.live_channels;

CREATE POLICY "Active channels viewable by everyone" ON public.live_channels AS PERMISSIVE FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Admins manage channels" ON public.live_channels AS PERMISSIVE FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Super admins manage channels" ON public.live_channels AS PERMISSIVE FOR ALL TO authenticated USING (public.has_super_admin(auth.uid())) WITH CHECK (public.has_super_admin(auth.uid()));

-- ========== m3u_sources ==========
DROP POLICY IF EXISTS "Admins manage m3u_sources" ON public.m3u_sources;
DROP POLICY IF EXISTS "Super admins manage m3u_sources" ON public.m3u_sources;

CREATE POLICY "Admins manage m3u_sources" ON public.m3u_sources AS PERMISSIVE FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Super admins manage m3u_sources" ON public.m3u_sources AS PERMISSIVE FOR ALL TO authenticated USING (public.has_super_admin(auth.uid())) WITH CHECK (public.has_super_admin(auth.uid()));

-- ========== messages ==========
DROP POLICY IF EXISTS "Admins can delete any message" ON public.messages;
DROP POLICY IF EXISTS "Admins can view all messages" ON public.messages;
DROP POLICY IF EXISTS "Super admins manage all messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages in their chats" ON public.messages;
DROP POLICY IF EXISTS "Users can view messages in their chats" ON public.messages;

CREATE POLICY "Users can view messages in their chats" ON public.messages AS PERMISSIVE FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM chats WHERE chats.id = messages.chat_id AND (chats.user1_id = auth.uid() OR chats.user2_id = auth.uid())));
CREATE POLICY "Users can send messages in their chats" ON public.messages AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id AND EXISTS (SELECT 1 FROM chats WHERE chats.id = messages.chat_id AND (chats.user1_id = auth.uid() OR chats.user2_id = auth.uid())));
CREATE POLICY "Admins can view all messages" ON public.messages AS PERMISSIVE FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete any message" ON public.messages AS PERMISSIVE FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Super admins manage all messages" ON public.messages AS PERMISSIVE FOR ALL TO authenticated USING (public.has_super_admin(auth.uid())) WITH CHECK (public.has_super_admin(auth.uid()));

-- ========== notifications ==========
DROP POLICY IF EXISTS "Triggers insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;

CREATE POLICY "Users can view own notifications" ON public.notifications AS PERMISSIVE FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Triggers insert notifications" ON public.notifications AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications AS PERMISSIVE FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ========== page_followers ==========
DROP POLICY IF EXISTS "Page followers viewable" ON public.page_followers;
DROP POLICY IF EXISTS "Users can follow pages" ON public.page_followers;
DROP POLICY IF EXISTS "Users can unfollow pages" ON public.page_followers;

CREATE POLICY "Page followers viewable" ON public.page_followers AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Users can follow pages" ON public.page_followers AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unfollow pages" ON public.page_followers AS PERMISSIVE FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ========== page_posts ==========
DROP POLICY IF EXISTS "Page creators can post" ON public.page_posts;
DROP POLICY IF EXISTS "Page posts viewable by everyone" ON public.page_posts;
DROP POLICY IF EXISTS "Users can delete own page posts" ON public.page_posts;

CREATE POLICY "Page posts viewable by everyone" ON public.page_posts AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Page creators can post" ON public.page_posts AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM pages WHERE pages.id = page_posts.page_id AND pages.creator_id = auth.uid()));
CREATE POLICY "Users can delete own page posts" ON public.page_posts AS PERMISSIVE FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ========== pages ==========
DROP POLICY IF EXISTS "Authenticated users can create pages" ON public.pages;
DROP POLICY IF EXISTS "Page creators can delete" ON public.pages;
DROP POLICY IF EXISTS "Page creators can update" ON public.pages;
DROP POLICY IF EXISTS "Pages viewable by everyone" ON public.pages;
DROP POLICY IF EXISTS "Platform admins can manage pages" ON public.pages;
DROP POLICY IF EXISTS "Super admins manage all pages" ON public.pages;

CREATE POLICY "Pages viewable by everyone" ON public.pages AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated users can create pages" ON public.pages AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Page creators can update" ON public.pages AS PERMISSIVE FOR UPDATE TO authenticated USING (auth.uid() = creator_id);
CREATE POLICY "Page creators can delete" ON public.pages AS PERMISSIVE FOR DELETE TO authenticated USING (auth.uid() = creator_id);
CREATE POLICY "Platform admins can manage pages" ON public.pages AS PERMISSIVE FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Super admins manage all pages" ON public.pages AS PERMISSIVE FOR ALL TO authenticated USING (public.has_super_admin(auth.uid())) WITH CHECK (public.has_super_admin(auth.uid()));

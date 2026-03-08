
-- =============================================
-- BATCH 3: likes, live_channels, m3u_sources, messages, notifications, page_followers, page_posts, pages
-- =============================================

-- likes
DROP POLICY IF EXISTS "Likes are viewable by everyone" ON public.likes;
DROP POLICY IF EXISTS "Users can like posts" ON public.likes;
DROP POLICY IF EXISTS "Users can unlike posts" ON public.likes;
CREATE POLICY "Likes are viewable by everyone" ON public.likes AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Users can like posts" ON public.likes AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike posts" ON public.likes AS PERMISSIVE FOR DELETE TO authenticated USING (auth.uid() = user_id);

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

-- messages
DROP POLICY IF EXISTS "Admins can delete any message" ON public.messages;
DROP POLICY IF EXISTS "Admins can view all messages" ON public.messages;
DROP POLICY IF EXISTS "Super admins manage all messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages in their chats" ON public.messages;
DROP POLICY IF EXISTS "Users can view messages in their chats" ON public.messages;
CREATE POLICY "Admins can delete any message" ON public.messages AS PERMISSIVE FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can view all messages" ON public.messages AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Super admins manage all messages" ON public.messages AS PERMISSIVE FOR ALL TO authenticated USING (has_super_admin(auth.uid())) WITH CHECK (has_super_admin(auth.uid()));
CREATE POLICY "Users can send messages in their chats" ON public.messages AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = sender_id) AND (EXISTS (SELECT 1 FROM chats WHERE chats.id = messages.chat_id AND (chats.user1_id = auth.uid() OR chats.user2_id = auth.uid()))));
CREATE POLICY "Users can view messages in their chats" ON public.messages AS PERMISSIVE FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM chats WHERE chats.id = messages.chat_id AND (chats.user1_id = auth.uid() OR chats.user2_id = auth.uid())));

-- notifications
DROP POLICY IF EXISTS "Triggers insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Triggers insert notifications" ON public.notifications AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications AS PERMISSIVE FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view own notifications" ON public.notifications AS PERMISSIVE FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- page_followers
DROP POLICY IF EXISTS "Page followers viewable" ON public.page_followers;
DROP POLICY IF EXISTS "Users can follow pages" ON public.page_followers;
DROP POLICY IF EXISTS "Users can unfollow pages" ON public.page_followers;
CREATE POLICY "Page followers viewable" ON public.page_followers AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Users can follow pages" ON public.page_followers AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unfollow pages" ON public.page_followers AS PERMISSIVE FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- page_posts
DROP POLICY IF EXISTS "Page creators can post" ON public.page_posts;
DROP POLICY IF EXISTS "Page posts viewable by everyone" ON public.page_posts;
DROP POLICY IF EXISTS "Users can delete own page posts" ON public.page_posts;
CREATE POLICY "Page creators can post" ON public.page_posts AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id) AND (EXISTS (SELECT 1 FROM pages WHERE pages.id = page_posts.page_id AND pages.creator_id = auth.uid())));
CREATE POLICY "Page posts viewable by everyone" ON public.page_posts AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Users can delete own page posts" ON public.page_posts AS PERMISSIVE FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- pages
DROP POLICY IF EXISTS "Authenticated users can create pages" ON public.pages;
DROP POLICY IF EXISTS "Page creators can delete" ON public.pages;
DROP POLICY IF EXISTS "Page creators can update" ON public.pages;
DROP POLICY IF EXISTS "Pages viewable by everyone" ON public.pages;
DROP POLICY IF EXISTS "Platform admins can manage pages" ON public.pages;
DROP POLICY IF EXISTS "Super admins manage all pages" ON public.pages;
CREATE POLICY "Authenticated users can create pages" ON public.pages AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Page creators can delete" ON public.pages AS PERMISSIVE FOR DELETE TO authenticated USING (auth.uid() = creator_id);
CREATE POLICY "Page creators can update" ON public.pages AS PERMISSIVE FOR UPDATE TO authenticated USING (auth.uid() = creator_id);
CREATE POLICY "Pages viewable by everyone" ON public.pages AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Platform admins can manage pages" ON public.pages AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Super admins manage all pages" ON public.pages AS PERMISSIVE FOR ALL TO authenticated USING (has_super_admin(auth.uid())) WITH CHECK (has_super_admin(auth.uid()));

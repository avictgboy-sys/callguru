
-- =============================================
-- BATCH 1: ad_views, app_settings, badges, calls
-- =============================================

-- ad_views
DROP POLICY IF EXISTS "Users can insert own ad views" ON public.ad_views;
DROP POLICY IF EXISTS "Users can view own ad views" ON public.ad_views;
CREATE POLICY "Users can insert own ad views" ON public.ad_views AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own ad views" ON public.ad_views AS PERMISSIVE FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- app_settings
DROP POLICY IF EXISTS "Admins can manage settings" ON public.app_settings;
DROP POLICY IF EXISTS "Settings are viewable by everyone" ON public.app_settings;
DROP POLICY IF EXISTS "Super admins manage app_settings" ON public.app_settings;
CREATE POLICY "Admins can manage settings" ON public.app_settings AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Settings are viewable by everyone" ON public.app_settings AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Super admins manage app_settings" ON public.app_settings AS PERMISSIVE FOR ALL TO authenticated USING (has_super_admin(auth.uid())) WITH CHECK (has_super_admin(auth.uid()));

-- badges
DROP POLICY IF EXISTS "Badges viewable by everyone" ON public.badges;
CREATE POLICY "Badges viewable by everyone" ON public.badges AS PERMISSIVE FOR SELECT TO public USING (true);

-- calls
DROP POLICY IF EXISTS "Admins can view all calls" ON public.calls;
DROP POLICY IF EXISTS "Super admins view all calls" ON public.calls;
DROP POLICY IF EXISTS "Users can start calls" ON public.calls;
DROP POLICY IF EXISTS "Users can view own calls" ON public.calls;
CREATE POLICY "Admins can view all calls" ON public.calls AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Super admins view all calls" ON public.calls AS PERMISSIVE FOR SELECT TO authenticated USING (has_super_admin(auth.uid()));
CREATE POLICY "Users can start calls" ON public.calls AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = caller_id);
CREATE POLICY "Users can view own calls" ON public.calls AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = caller_id) OR (auth.uid() = provider_id));

-- chats
DROP POLICY IF EXISTS "Admins can view all chats" ON public.chats;
DROP POLICY IF EXISTS "Super admins manage all chats" ON public.chats;
DROP POLICY IF EXISTS "Users can create chats they belong to" ON public.chats;
DROP POLICY IF EXISTS "Users can update their own chats" ON public.chats;
DROP POLICY IF EXISTS "Users can view their own chats" ON public.chats;
CREATE POLICY "Admins can view all chats" ON public.chats AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Super admins manage all chats" ON public.chats AS PERMISSIVE FOR ALL TO authenticated USING (has_super_admin(auth.uid())) WITH CHECK (has_super_admin(auth.uid()));
CREATE POLICY "Users can create chats they belong to" ON public.chats AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user1_id) OR (auth.uid() = user2_id));
CREATE POLICY "Users can update their own chats" ON public.chats AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = user1_id) OR (auth.uid() = user2_id));
CREATE POLICY "Users can view their own chats" ON public.chats AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user1_id) OR (auth.uid() = user2_id));

-- comments
DROP POLICY IF EXISTS "Admins can delete any comment" ON public.comments;
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
DROP POLICY IF EXISTS "Users can create comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;
CREATE POLICY "Admins can delete any comment" ON public.comments AS PERMISSIVE FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Comments are viewable by everyone" ON public.comments AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Users can create comments" ON public.comments AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON public.comments AS PERMISSIVE FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- disputes
DROP POLICY IF EXISTS "Admins can update disputes" ON public.disputes;
DROP POLICY IF EXISTS "Admins can view all disputes" ON public.disputes;
DROP POLICY IF EXISTS "Super admins manage all disputes" ON public.disputes;
DROP POLICY IF EXISTS "Users can create disputes" ON public.disputes;
DROP POLICY IF EXISTS "Users can view own disputes" ON public.disputes;
CREATE POLICY "Admins can update disputes" ON public.disputes AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can view all disputes" ON public.disputes AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Super admins manage all disputes" ON public.disputes AS PERMISSIVE FOR ALL TO authenticated USING (has_super_admin(auth.uid())) WITH CHECK (has_super_admin(auth.uid()));
CREATE POLICY "Users can create disputes" ON public.disputes AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = complainant_id);
CREATE POLICY "Users can view own disputes" ON public.disputes AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = complainant_id) OR (auth.uid() = against_id));

-- follows
DROP POLICY IF EXISTS "Follows are viewable by everyone" ON public.follows;
DROP POLICY IF EXISTS "Users can follow others" ON public.follows;
DROP POLICY IF EXISTS "Users can unfollow" ON public.follows;
CREATE POLICY "Follows are viewable by everyone" ON public.follows AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Users can follow others" ON public.follows AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = follower_id) AND (follower_id <> following_id));
CREATE POLICY "Users can unfollow" ON public.follows AS PERMISSIVE FOR DELETE TO authenticated USING (auth.uid() = follower_id);

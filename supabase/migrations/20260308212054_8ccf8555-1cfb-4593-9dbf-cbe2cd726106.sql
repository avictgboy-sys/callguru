
-- ========== ad_views ==========
DROP POLICY IF EXISTS "Users can insert own ad views" ON public.ad_views;
DROP POLICY IF EXISTS "Users can view own ad views" ON public.ad_views;

CREATE POLICY "Users can insert own ad views" ON public.ad_views AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own ad views" ON public.ad_views AS PERMISSIVE FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ========== app_settings ==========
DROP POLICY IF EXISTS "Admins can manage settings" ON public.app_settings;
DROP POLICY IF EXISTS "Settings are viewable by everyone" ON public.app_settings;
DROP POLICY IF EXISTS "Super admins manage app_settings" ON public.app_settings;

CREATE POLICY "Settings are viewable by everyone" ON public.app_settings AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Admins can manage settings" ON public.app_settings AS PERMISSIVE FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Super admins manage app_settings" ON public.app_settings AS PERMISSIVE FOR ALL TO authenticated USING (public.has_super_admin(auth.uid())) WITH CHECK (public.has_super_admin(auth.uid()));

-- ========== badges ==========
DROP POLICY IF EXISTS "Badges viewable by everyone" ON public.badges;
CREATE POLICY "Badges viewable by everyone" ON public.badges AS PERMISSIVE FOR SELECT TO public USING (true);

-- ========== calls ==========
DROP POLICY IF EXISTS "Admins can view all calls" ON public.calls;
DROP POLICY IF EXISTS "Super admins view all calls" ON public.calls;
DROP POLICY IF EXISTS "Users can start calls" ON public.calls;
DROP POLICY IF EXISTS "Users can view own calls" ON public.calls;

CREATE POLICY "Users can view own calls" ON public.calls AS PERMISSIVE FOR SELECT TO authenticated USING (auth.uid() = caller_id OR auth.uid() = provider_id);
CREATE POLICY "Users can start calls" ON public.calls AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = caller_id);
CREATE POLICY "Admins can view all calls" ON public.calls AS PERMISSIVE FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Super admins view all calls" ON public.calls AS PERMISSIVE FOR SELECT TO authenticated USING (public.has_super_admin(auth.uid()));

-- ========== chats ==========
DROP POLICY IF EXISTS "Admins can view all chats" ON public.chats;
DROP POLICY IF EXISTS "Super admins manage all chats" ON public.chats;
DROP POLICY IF EXISTS "Users can create chats they belong to" ON public.chats;
DROP POLICY IF EXISTS "Users can update their own chats" ON public.chats;
DROP POLICY IF EXISTS "Users can view their own chats" ON public.chats;

CREATE POLICY "Users can view their own chats" ON public.chats AS PERMISSIVE FOR SELECT TO authenticated USING (auth.uid() = user1_id OR auth.uid() = user2_id);
CREATE POLICY "Users can create chats they belong to" ON public.chats AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);
CREATE POLICY "Users can update their own chats" ON public.chats AS PERMISSIVE FOR UPDATE TO authenticated USING (auth.uid() = user1_id OR auth.uid() = user2_id);
CREATE POLICY "Admins can view all chats" ON public.chats AS PERMISSIVE FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Super admins manage all chats" ON public.chats AS PERMISSIVE FOR ALL TO authenticated USING (public.has_super_admin(auth.uid())) WITH CHECK (public.has_super_admin(auth.uid()));

-- ========== disputes ==========
DROP POLICY IF EXISTS "Admins can update disputes" ON public.disputes;
DROP POLICY IF EXISTS "Admins can view all disputes" ON public.disputes;
DROP POLICY IF EXISTS "Super admins manage all disputes" ON public.disputes;
DROP POLICY IF EXISTS "Users can create disputes" ON public.disputes;
DROP POLICY IF EXISTS "Users can view own disputes" ON public.disputes;

CREATE POLICY "Users can view own disputes" ON public.disputes AS PERMISSIVE FOR SELECT TO authenticated USING (auth.uid() = complainant_id OR auth.uid() = against_id);
CREATE POLICY "Users can create disputes" ON public.disputes AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = complainant_id);
CREATE POLICY "Admins can view all disputes" ON public.disputes AS PERMISSIVE FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update disputes" ON public.disputes AS PERMISSIVE FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Super admins manage all disputes" ON public.disputes AS PERMISSIVE FOR ALL TO authenticated USING (public.has_super_admin(auth.uid())) WITH CHECK (public.has_super_admin(auth.uid()));

-- ========== group_members ==========
DROP POLICY IF EXISTS "Group admins can manage members" ON public.group_members;
DROP POLICY IF EXISTS "Group admins can remove members" ON public.group_members;
DROP POLICY IF EXISTS "Group members viewable by authenticated" ON public.group_members;
DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON public.group_members;

CREATE POLICY "Group members viewable by authenticated" ON public.group_members AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Users can join groups" ON public.group_members AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave groups" ON public.group_members AS PERMISSIVE FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Group admins can manage members" ON public.group_members AS PERMISSIVE FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid() AND gm.role IN ('admin','moderator')));
CREATE POLICY "Group admins can remove members" ON public.group_members AS PERMISSIVE FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid() AND gm.role IN ('admin','moderator')));

-- ========== group_posts ==========
DROP POLICY IF EXISTS "Group admins can delete posts" ON public.group_posts;
DROP POLICY IF EXISTS "Group posts viewable by members" ON public.group_posts;
DROP POLICY IF EXISTS "Members can create posts" ON public.group_posts;
DROP POLICY IF EXISTS "Users can delete own group posts" ON public.group_posts;

CREATE POLICY "Group posts viewable by members" ON public.group_posts AS PERMISSIVE FOR SELECT TO public USING (
  EXISTS (SELECT 1 FROM group_members WHERE group_members.group_id = group_posts.group_id AND group_members.user_id = auth.uid() AND group_members.status = 'approved')
  OR EXISTS (SELECT 1 FROM groups WHERE groups.id = group_posts.group_id AND groups.privacy = 'public')
);
CREATE POLICY "Members can create posts" ON public.group_posts AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = user_id AND EXISTS (SELECT 1 FROM group_members WHERE group_members.group_id = group_posts.group_id AND group_members.user_id = auth.uid() AND group_members.status = 'approved')
);
CREATE POLICY "Users can delete own group posts" ON public.group_posts AS PERMISSIVE FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Group admins can delete posts" ON public.group_posts AS PERMISSIVE FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM group_members WHERE group_members.group_id = group_posts.group_id AND group_members.user_id = auth.uid() AND group_members.role IN ('admin','moderator'))
);

-- ========== groups ==========
DROP POLICY IF EXISTS "Authenticated users can create groups" ON public.groups;
DROP POLICY IF EXISTS "Group admins can delete" ON public.groups;
DROP POLICY IF EXISTS "Group admins can update" ON public.groups;
DROP POLICY IF EXISTS "Platform admins can manage groups" ON public.groups;
DROP POLICY IF EXISTS "Public/private groups viewable by everyone" ON public.groups;
DROP POLICY IF EXISTS "Secret groups viewable by members" ON public.groups;
DROP POLICY IF EXISTS "Super admins manage all groups" ON public.groups;

CREATE POLICY "Public/private groups viewable by everyone" ON public.groups AS PERMISSIVE FOR SELECT TO public USING (privacy IN ('public','private'));
CREATE POLICY "Secret groups viewable by members" ON public.groups AS PERMISSIVE FOR SELECT TO authenticated USING (privacy = 'secret' AND EXISTS (SELECT 1 FROM group_members WHERE group_members.group_id = groups.id AND group_members.user_id = auth.uid() AND group_members.status = 'approved'));
CREATE POLICY "Authenticated users can create groups" ON public.groups AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Group admins can update" ON public.groups AS PERMISSIVE FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM group_members WHERE group_members.group_id = groups.id AND group_members.user_id = auth.uid() AND group_members.role = 'admin'));
CREATE POLICY "Group admins can delete" ON public.groups AS PERMISSIVE FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM group_members WHERE group_members.group_id = groups.id AND group_members.user_id = auth.uid() AND group_members.role = 'admin'));
CREATE POLICY "Platform admins can manage groups" ON public.groups AS PERMISSIVE FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Super admins manage all groups" ON public.groups AS PERMISSIVE FOR ALL TO authenticated USING (public.has_super_admin(auth.uid())) WITH CHECK (public.has_super_admin(auth.uid()));

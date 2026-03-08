
-- BATCH 3: groups, group_members, group_posts, pages, page_followers, page_posts, services, calls

-- groups
DROP POLICY IF EXISTS "Public/private groups viewable by everyone" ON public.groups;
DROP POLICY IF EXISTS "Secret groups viewable by members" ON public.groups;
DROP POLICY IF EXISTS "Authenticated users can create groups" ON public.groups;
DROP POLICY IF EXISTS "Group admins can update" ON public.groups;
DROP POLICY IF EXISTS "Group admins can delete" ON public.groups;
DROP POLICY IF EXISTS "Platform admins can manage groups" ON public.groups;
DROP POLICY IF EXISTS "Super admins manage all groups" ON public.groups;
CREATE POLICY "Public/private groups viewable by everyone" ON public.groups AS PERMISSIVE FOR SELECT TO public USING (privacy = ANY (ARRAY['public'::text, 'private'::text]));
CREATE POLICY "Secret groups viewable by members" ON public.groups AS PERMISSIVE FOR SELECT TO authenticated USING ((privacy = 'secret'::text) AND (EXISTS (SELECT 1 FROM group_members WHERE group_members.group_id = groups.id AND group_members.user_id = auth.uid() AND group_members.status = 'approved'::text)));
CREATE POLICY "Authenticated users can create groups" ON public.groups AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Group admins can update" ON public.groups AS PERMISSIVE FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM group_members WHERE group_members.group_id = groups.id AND group_members.user_id = auth.uid() AND group_members.role = 'admin'::text));
CREATE POLICY "Group admins can delete" ON public.groups AS PERMISSIVE FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM group_members WHERE group_members.group_id = groups.id AND group_members.user_id = auth.uid() AND group_members.role = 'admin'::text));
CREATE POLICY "Platform admins can manage groups" ON public.groups AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Super admins manage all groups" ON public.groups AS PERMISSIVE FOR ALL TO authenticated USING (has_super_admin(auth.uid())) WITH CHECK (has_super_admin(auth.uid()));

-- group_members
DROP POLICY IF EXISTS "Group members viewable by authenticated" ON public.group_members;
DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON public.group_members;
DROP POLICY IF EXISTS "Group admins can manage members" ON public.group_members;
DROP POLICY IF EXISTS "Group admins can remove members" ON public.group_members;
CREATE POLICY "Group members viewable by authenticated" ON public.group_members AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Users can join groups" ON public.group_members AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave groups" ON public.group_members AS PERMISSIVE FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Group admins can manage members" ON public.group_members AS PERMISSIVE FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid() AND gm.role = ANY (ARRAY['admin'::text, 'moderator'::text])));
CREATE POLICY "Group admins can remove members" ON public.group_members AS PERMISSIVE FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid() AND gm.role = ANY (ARRAY['admin'::text, 'moderator'::text])));

-- group_posts
DROP POLICY IF EXISTS "Group posts viewable by members" ON public.group_posts;
DROP POLICY IF EXISTS "Members can create posts" ON public.group_posts;
DROP POLICY IF EXISTS "Users can delete own group posts" ON public.group_posts;
DROP POLICY IF EXISTS "Group admins can delete posts" ON public.group_posts;
CREATE POLICY "Group posts viewable by members" ON public.group_posts AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS (SELECT 1 FROM group_members WHERE group_members.group_id = group_posts.group_id AND group_members.user_id = auth.uid() AND group_members.status = 'approved'::text)) OR (EXISTS (SELECT 1 FROM groups WHERE groups.id = group_posts.group_id AND groups.privacy = 'public'::text)));
CREATE POLICY "Members can create posts" ON public.group_posts AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id) AND (EXISTS (SELECT 1 FROM group_members WHERE group_members.group_id = group_posts.group_id AND group_members.user_id = auth.uid() AND group_members.status = 'approved'::text)));
CREATE POLICY "Users can delete own group posts" ON public.group_posts AS PERMISSIVE FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Group admins can delete posts" ON public.group_posts AS PERMISSIVE FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM group_members WHERE group_members.group_id = group_posts.group_id AND group_members.user_id = auth.uid() AND group_members.role = ANY (ARRAY['admin'::text, 'moderator'::text])));

-- pages
DROP POLICY IF EXISTS "Pages viewable by everyone" ON public.pages;
DROP POLICY IF EXISTS "Authenticated users can create pages" ON public.pages;
DROP POLICY IF EXISTS "Page creators can update" ON public.pages;
DROP POLICY IF EXISTS "Page creators can delete" ON public.pages;
DROP POLICY IF EXISTS "Platform admins can manage pages" ON public.pages;
DROP POLICY IF EXISTS "Super admins manage all pages" ON public.pages;
CREATE POLICY "Pages viewable by everyone" ON public.pages AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated users can create pages" ON public.pages AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Page creators can update" ON public.pages AS PERMISSIVE FOR UPDATE TO authenticated USING (auth.uid() = creator_id);
CREATE POLICY "Page creators can delete" ON public.pages AS PERMISSIVE FOR DELETE TO authenticated USING (auth.uid() = creator_id);
CREATE POLICY "Platform admins can manage pages" ON public.pages AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Super admins manage all pages" ON public.pages AS PERMISSIVE FOR ALL TO authenticated USING (has_super_admin(auth.uid())) WITH CHECK (has_super_admin(auth.uid()));

-- page_followers
DROP POLICY IF EXISTS "Page followers viewable" ON public.page_followers;
DROP POLICY IF EXISTS "Users can follow pages" ON public.page_followers;
DROP POLICY IF EXISTS "Users can unfollow pages" ON public.page_followers;
CREATE POLICY "Page followers viewable" ON public.page_followers AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Users can follow pages" ON public.page_followers AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unfollow pages" ON public.page_followers AS PERMISSIVE FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- page_posts
DROP POLICY IF EXISTS "Page posts viewable by everyone" ON public.page_posts;
DROP POLICY IF EXISTS "Page creators can post" ON public.page_posts;
DROP POLICY IF EXISTS "Users can delete own page posts" ON public.page_posts;
CREATE POLICY "Page posts viewable by everyone" ON public.page_posts AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Page creators can post" ON public.page_posts AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id) AND (EXISTS (SELECT 1 FROM pages WHERE pages.id = page_posts.page_id AND pages.creator_id = auth.uid())));
CREATE POLICY "Users can delete own page posts" ON public.page_posts AS PERMISSIVE FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- services
DROP POLICY IF EXISTS "Active services viewable" ON public.services;
DROP POLICY IF EXISTS "Providers can create services" ON public.services;
DROP POLICY IF EXISTS "Providers can update own services" ON public.services;
DROP POLICY IF EXISTS "Providers can delete own services" ON public.services;
DROP POLICY IF EXISTS "Admins can manage services" ON public.services;
DROP POLICY IF EXISTS "Super admins manage services" ON public.services;
CREATE POLICY "Active services viewable" ON public.services AS PERMISSIVE FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Providers can create services" ON public.services AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = provider_id);
CREATE POLICY "Providers can update own services" ON public.services AS PERMISSIVE FOR UPDATE TO authenticated USING (auth.uid() = provider_id);
CREATE POLICY "Providers can delete own services" ON public.services AS PERMISSIVE FOR DELETE TO authenticated USING (auth.uid() = provider_id);
CREATE POLICY "Admins can manage services" ON public.services AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Super admins manage services" ON public.services AS PERMISSIVE FOR ALL TO authenticated USING (has_super_admin(auth.uid())) WITH CHECK (has_super_admin(auth.uid()));

-- calls
DROP POLICY IF EXISTS "Users can view own calls" ON public.calls;
DROP POLICY IF EXISTS "Users can start calls" ON public.calls;
DROP POLICY IF EXISTS "Admins can view all calls" ON public.calls;
DROP POLICY IF EXISTS "Super admins view all calls" ON public.calls;
CREATE POLICY "Users can view own calls" ON public.calls AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = caller_id) OR (auth.uid() = provider_id));
CREATE POLICY "Users can start calls" ON public.calls AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = caller_id);
CREATE POLICY "Admins can view all calls" ON public.calls AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Super admins view all calls" ON public.calls AS PERMISSIVE FOR SELECT TO authenticated USING (has_super_admin(auth.uid()));

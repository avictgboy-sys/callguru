
-- =============================================
-- BATCH 2: group_members, group_posts, groups, home_bookings, home_service_categories, home_services
-- =============================================

-- group_members
DROP POLICY IF EXISTS "Group admins can manage members" ON public.group_members;
DROP POLICY IF EXISTS "Group admins can remove members" ON public.group_members;
DROP POLICY IF EXISTS "Group members viewable by authenticated" ON public.group_members;
DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON public.group_members;
CREATE POLICY "Group admins can manage members" ON public.group_members AS PERMISSIVE FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid() AND gm.role = ANY (ARRAY['admin','moderator'])));
CREATE POLICY "Group admins can remove members" ON public.group_members AS PERMISSIVE FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid() AND gm.role = ANY (ARRAY['admin','moderator'])));
CREATE POLICY "Group members viewable by authenticated" ON public.group_members AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Users can join groups" ON public.group_members AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave groups" ON public.group_members AS PERMISSIVE FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- group_posts
DROP POLICY IF EXISTS "Group admins can delete posts" ON public.group_posts;
DROP POLICY IF EXISTS "Group posts viewable by members" ON public.group_posts;
DROP POLICY IF EXISTS "Members can create posts" ON public.group_posts;
DROP POLICY IF EXISTS "Users can delete own group posts" ON public.group_posts;
CREATE POLICY "Group admins can delete posts" ON public.group_posts AS PERMISSIVE FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM group_members WHERE group_members.group_id = group_posts.group_id AND group_members.user_id = auth.uid() AND group_members.role = ANY (ARRAY['admin','moderator'])));
CREATE POLICY "Group posts viewable by members" ON public.group_posts AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS (SELECT 1 FROM group_members WHERE group_members.group_id = group_posts.group_id AND group_members.user_id = auth.uid() AND group_members.status = 'approved')) OR (EXISTS (SELECT 1 FROM groups WHERE groups.id = group_posts.group_id AND groups.privacy = 'public')));
CREATE POLICY "Members can create posts" ON public.group_posts AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id) AND (EXISTS (SELECT 1 FROM group_members WHERE group_members.group_id = group_posts.group_id AND group_members.user_id = auth.uid() AND group_members.status = 'approved')));
CREATE POLICY "Users can delete own group posts" ON public.group_posts AS PERMISSIVE FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- groups
DROP POLICY IF EXISTS "Authenticated users can create groups" ON public.groups;
DROP POLICY IF EXISTS "Group admins can delete" ON public.groups;
DROP POLICY IF EXISTS "Group admins can update" ON public.groups;
DROP POLICY IF EXISTS "Platform admins can manage groups" ON public.groups;
DROP POLICY IF EXISTS "Public/private groups viewable by everyone" ON public.groups;
DROP POLICY IF EXISTS "Secret groups viewable by members" ON public.groups;
DROP POLICY IF EXISTS "Super admins manage all groups" ON public.groups;
CREATE POLICY "Authenticated users can create groups" ON public.groups AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Group admins can delete" ON public.groups AS PERMISSIVE FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM group_members WHERE group_members.group_id = groups.id AND group_members.user_id = auth.uid() AND group_members.role = 'admin'));
CREATE POLICY "Group admins can update" ON public.groups AS PERMISSIVE FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM group_members WHERE group_members.group_id = groups.id AND group_members.user_id = auth.uid() AND group_members.role = 'admin'));
CREATE POLICY "Platform admins can manage groups" ON public.groups AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Public/private groups viewable by everyone" ON public.groups AS PERMISSIVE FOR SELECT TO public USING (privacy = ANY (ARRAY['public','private']));
CREATE POLICY "Secret groups viewable by members" ON public.groups AS PERMISSIVE FOR SELECT TO authenticated USING ((privacy = 'secret') AND (EXISTS (SELECT 1 FROM group_members WHERE group_members.group_id = groups.id AND group_members.user_id = auth.uid() AND group_members.status = 'approved')));
CREATE POLICY "Super admins manage all groups" ON public.groups AS PERMISSIVE FOR ALL TO authenticated USING (has_super_admin(auth.uid())) WITH CHECK (has_super_admin(auth.uid()));

-- home_bookings
DROP POLICY IF EXISTS "Admins can manage bookings" ON public.home_bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.home_bookings;
DROP POLICY IF EXISTS "Customers can create bookings" ON public.home_bookings;
DROP POLICY IF EXISTS "Customers can update own bookings restricted" ON public.home_bookings;
DROP POLICY IF EXISTS "Providers can update own bookings restricted" ON public.home_bookings;
DROP POLICY IF EXISTS "Super admins manage all home_bookings" ON public.home_bookings;
DROP POLICY IF EXISTS "Users can view own bookings" ON public.home_bookings;
CREATE POLICY "Admins can manage bookings" ON public.home_bookings AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can view all bookings" ON public.home_bookings AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Customers can create bookings" ON public.home_bookings AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Customers can update own bookings restricted" ON public.home_bookings AS PERMISSIVE FOR UPDATE TO authenticated USING (auth.uid() = customer_id) WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Providers can update own bookings restricted" ON public.home_bookings AS PERMISSIVE FOR UPDATE TO authenticated USING (auth.uid() = provider_id) WITH CHECK (auth.uid() = provider_id);
CREATE POLICY "Super admins manage all home_bookings" ON public.home_bookings AS PERMISSIVE FOR ALL TO authenticated USING (has_super_admin(auth.uid())) WITH CHECK (has_super_admin(auth.uid()));
CREATE POLICY "Users can view own bookings" ON public.home_bookings AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = customer_id) OR (auth.uid() = provider_id));

-- home_service_categories
DROP POLICY IF EXISTS "Home service categories viewable by everyone" ON public.home_service_categories;
CREATE POLICY "Home service categories viewable by everyone" ON public.home_service_categories AS PERMISSIVE FOR SELECT TO public USING (true);

-- home_services
DROP POLICY IF EXISTS "Admins can manage home services" ON public.home_services;
DROP POLICY IF EXISTS "Admins can view all home services" ON public.home_services;
DROP POLICY IF EXISTS "Home services viewable by everyone" ON public.home_services;
DROP POLICY IF EXISTS "Providers can create home services" ON public.home_services;
DROP POLICY IF EXISTS "Providers can delete own home services" ON public.home_services;
DROP POLICY IF EXISTS "Providers can update own home services" ON public.home_services;
DROP POLICY IF EXISTS "Super admins manage all home_services" ON public.home_services;
CREATE POLICY "Admins can manage home services" ON public.home_services AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can view all home services" ON public.home_services AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Home services viewable by everyone" ON public.home_services AS PERMISSIVE FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Providers can create home services" ON public.home_services AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = provider_id);
CREATE POLICY "Providers can delete own home services" ON public.home_services AS PERMISSIVE FOR DELETE TO authenticated USING (auth.uid() = provider_id);
CREATE POLICY "Providers can update own home services" ON public.home_services AS PERMISSIVE FOR UPDATE TO authenticated USING (auth.uid() = provider_id);
CREATE POLICY "Super admins manage all home_services" ON public.home_services AS PERMISSIVE FOR ALL TO authenticated USING (has_super_admin(auth.uid())) WITH CHECK (has_super_admin(auth.uid()));


-- Step 2: Create function and policies for super_admin
CREATE OR REPLACE FUNCTION public.has_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'super_admin'
  )
$$;

CREATE POLICY "Super admins can manage all roles" ON public.user_roles FOR ALL USING (has_super_admin(auth.uid()));
CREATE POLICY "Super admins can manage profiles" ON public.profiles FOR ALL USING (has_super_admin(auth.uid()));
CREATE POLICY "Super admins manage all services" ON public.services FOR ALL USING (has_super_admin(auth.uid()));
CREATE POLICY "Super admins manage all posts" ON public.posts FOR ALL USING (has_super_admin(auth.uid()));
CREATE POLICY "Super admins manage all home_services" ON public.home_services FOR ALL USING (has_super_admin(auth.uid()));
CREATE POLICY "Super admins manage all home_bookings" ON public.home_bookings FOR ALL USING (has_super_admin(auth.uid()));
CREATE POLICY "Super admins manage all groups" ON public.groups FOR ALL USING (has_super_admin(auth.uid()));
CREATE POLICY "Super admins manage all pages" ON public.pages FOR ALL USING (has_super_admin(auth.uid()));
CREATE POLICY "Super admins manage app_settings" ON public.app_settings FOR ALL USING (has_super_admin(auth.uid()));
CREATE POLICY "Super admins manage all disputes" ON public.disputes FOR ALL USING (has_super_admin(auth.uid()));
CREATE POLICY "Super admins view all calls" ON public.calls FOR SELECT USING (has_super_admin(auth.uid()));
CREATE POLICY "Super admins view all payments" ON public.payment_requests FOR ALL USING (has_super_admin(auth.uid()));
CREATE POLICY "Super admins view all transactions" ON public.wallet_transactions FOR SELECT USING (has_super_admin(auth.uid()));
CREATE POLICY "Super admins manage all chats" ON public.chats FOR ALL USING (has_super_admin(auth.uid()));
CREATE POLICY "Super admins manage all messages" ON public.messages FOR ALL USING (has_super_admin(auth.uid()));

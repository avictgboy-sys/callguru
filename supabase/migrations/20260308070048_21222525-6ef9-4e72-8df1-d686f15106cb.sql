
-- Admin can see ALL services (including inactive)
CREATE POLICY "Admins can view all services"
ON public.services FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can update any service
CREATE POLICY "Admins can update any service"
ON public.services FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can delete any service
CREATE POLICY "Admins can delete any service"
ON public.services FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can update any profile (e.g. verify users)
CREATE POLICY "Admins can update any profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can delete any post
CREATE POLICY "Admins can delete any post"
ON public.posts FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can update any post (e.g. hide/moderate)
CREATE POLICY "Admins can update any post"
ON public.posts FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can delete any comment
CREATE POLICY "Admins can delete any comment"
ON public.comments FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

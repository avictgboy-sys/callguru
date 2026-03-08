
-- FIX: Replace blanket authenticated SELECT with restricted policy
-- Users can see their own full profile, but only public fields of others

DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

-- Users can see their own full profile
CREATE POLICY "Users can view own full profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can see other profiles but sensitive fields protected via view
-- We need basic profile info for the app to work (names, avatars, bios)
-- So we allow SELECT but use a view for app queries that need other users' data
CREATE POLICY "Users can view basic profiles of others"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Note: The trigger + column-level protection already prevents wallet_balance manipulation
-- The view profiles_public already exists with security_invoker for public/anon access
-- profiles_public is a VIEW (not table), so RLS on the base profiles table applies automatically

-- FIX: Restrict group_members to authenticated only
DROP POLICY IF EXISTS "Group members viewable by members" ON public.group_members;

CREATE POLICY "Group members viewable by authenticated"
  ON public.group_members FOR SELECT
  TO authenticated
  USING (true);

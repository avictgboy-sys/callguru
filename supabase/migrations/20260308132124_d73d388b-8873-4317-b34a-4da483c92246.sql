
-- Groups table
CREATE TABLE public.groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  cover_image_url text,
  privacy text NOT NULL DEFAULT 'public' CHECK (privacy IN ('public', 'private', 'secret')),
  creator_id uuid NOT NULL,
  member_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Group members
CREATE TABLE public.group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  status text NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Group posts
CREATE TABLE public.group_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text,
  image_url text,
  likes_count integer NOT NULL DEFAULT 0,
  comments_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Pages table
CREATE TABLE public.pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  cover_image_url text,
  avatar_url text,
  category text DEFAULT 'general',
  creator_id uuid NOT NULL,
  follower_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Page followers
CREATE TABLE public.page_followers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(page_id, user_id)
);

-- Page posts
CREATE TABLE public.page_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text,
  image_url text,
  likes_count integer NOT NULL DEFAULT 0,
  comments_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS for groups
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public/private groups viewable by everyone" ON public.groups FOR SELECT USING (privacy IN ('public', 'private'));
CREATE POLICY "Secret groups viewable by members" ON public.groups FOR SELECT USING (
  privacy = 'secret' AND EXISTS (
    SELECT 1 FROM public.group_members WHERE group_id = groups.id AND user_id = auth.uid() AND status = 'approved'
  )
);
CREATE POLICY "Authenticated users can create groups" ON public.groups FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Group admins can update" ON public.groups FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.group_members WHERE group_id = groups.id AND user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Group admins can delete" ON public.groups FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.group_members WHERE group_id = groups.id AND user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Platform admins can manage groups" ON public.groups FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS for group_members
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Group members viewable by members" ON public.group_members FOR SELECT USING (true);
CREATE POLICY "Users can join groups" ON public.group_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave groups" ON public.group_members FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Group admins can manage members" ON public.group_members FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid() AND gm.role IN ('admin', 'moderator'))
);
CREATE POLICY "Group admins can remove members" ON public.group_members FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid() AND gm.role IN ('admin', 'moderator'))
);

-- RLS for group_posts
ALTER TABLE public.group_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Group posts viewable by members" ON public.group_posts FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.group_members WHERE group_id = group_posts.group_id AND user_id = auth.uid() AND status = 'approved')
  OR EXISTS (SELECT 1 FROM public.groups WHERE id = group_posts.group_id AND privacy = 'public')
);
CREATE POLICY "Members can create posts" ON public.group_posts FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.group_members WHERE group_id = group_posts.group_id AND user_id = auth.uid() AND status = 'approved')
);
CREATE POLICY "Users can delete own group posts" ON public.group_posts FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Group admins can delete posts" ON public.group_posts FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.group_members WHERE group_id = group_posts.group_id AND user_id = auth.uid() AND role IN ('admin', 'moderator'))
);

-- RLS for pages
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pages viewable by everyone" ON public.pages FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create pages" ON public.pages FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Page creators can update" ON public.pages FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Page creators can delete" ON public.pages FOR DELETE USING (auth.uid() = creator_id);
CREATE POLICY "Platform admins can manage pages" ON public.pages FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS for page_followers
ALTER TABLE public.page_followers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Page followers viewable" ON public.page_followers FOR SELECT USING (true);
CREATE POLICY "Users can follow pages" ON public.page_followers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unfollow pages" ON public.page_followers FOR DELETE USING (auth.uid() = user_id);

-- RLS for page_posts
ALTER TABLE public.page_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Page posts viewable by everyone" ON public.page_posts FOR SELECT USING (true);
CREATE POLICY "Page creators can post" ON public.page_posts FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.pages WHERE id = page_posts.page_id AND creator_id = auth.uid())
);
CREATE POLICY "Users can delete own page posts" ON public.page_posts FOR DELETE USING (auth.uid() = user_id);

-- Triggers for member count
CREATE OR REPLACE FUNCTION public.update_group_member_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'approved' THEN
    UPDATE groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'approved' THEN
    UPDATE groups SET member_count = member_count - 1 WHERE id = OLD.group_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status != 'approved' AND NEW.status = 'approved' THEN
    UPDATE groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'approved' AND NEW.status != 'approved' THEN
    UPDATE groups SET member_count = member_count - 1 WHERE id = NEW.group_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_update_group_member_count
AFTER INSERT OR UPDATE OR DELETE ON public.group_members
FOR EACH ROW EXECUTE FUNCTION public.update_group_member_count();

-- Triggers for page follower count
CREATE OR REPLACE FUNCTION public.update_page_follower_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE pages SET follower_count = follower_count + 1 WHERE id = NEW.page_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE pages SET follower_count = follower_count - 1 WHERE id = OLD.page_id;
    RETURN OLD;
  END IF;
END;
$$;

CREATE TRIGGER trg_update_page_follower_count
AFTER INSERT OR DELETE ON public.page_followers
FOR EACH ROW EXECUTE FUNCTION public.update_page_follower_count();

-- Storage bucket for group/page images
INSERT INTO storage.buckets (id, name, public) VALUES ('group-images', 'group-images', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('page-images', 'page-images', true) ON CONFLICT DO NOTHING;

-- Storage policies
CREATE POLICY "Anyone can view group images" ON storage.objects FOR SELECT USING (bucket_id = 'group-images');
CREATE POLICY "Authenticated can upload group images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'group-images');
CREATE POLICY "Anyone can view page images" ON storage.objects FOR SELECT USING (bucket_id = 'page-images');
CREATE POLICY "Authenticated can upload page images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'page-images');

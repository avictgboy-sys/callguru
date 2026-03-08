
-- BATCH 2: chats, messages, notifications, reels, reel_likes, reel_comments, reviews

-- chats
DROP POLICY IF EXISTS "Users can view their own chats" ON public.chats;
DROP POLICY IF EXISTS "Users can create chats they belong to" ON public.chats;
DROP POLICY IF EXISTS "Users can update their own chats" ON public.chats;
DROP POLICY IF EXISTS "Admins can view all chats" ON public.chats;
DROP POLICY IF EXISTS "Super admins manage all chats" ON public.chats;
CREATE POLICY "Users can view their own chats" ON public.chats AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user1_id) OR (auth.uid() = user2_id));
CREATE POLICY "Users can create chats they belong to" ON public.chats AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user1_id) OR (auth.uid() = user2_id));
CREATE POLICY "Users can update their own chats" ON public.chats AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = user1_id) OR (auth.uid() = user2_id));
CREATE POLICY "Admins can view all chats" ON public.chats AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Super admins manage all chats" ON public.chats AS PERMISSIVE FOR ALL TO authenticated USING (has_super_admin(auth.uid())) WITH CHECK (has_super_admin(auth.uid()));

-- messages
DROP POLICY IF EXISTS "Users can view messages in their chats" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages in their chats" ON public.messages;
DROP POLICY IF EXISTS "Admins can view all messages" ON public.messages;
DROP POLICY IF EXISTS "Admins can delete any message" ON public.messages;
DROP POLICY IF EXISTS "Super admins manage all messages" ON public.messages;
CREATE POLICY "Users can view messages in their chats" ON public.messages AS PERMISSIVE FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM chats WHERE chats.id = messages.chat_id AND (chats.user1_id = auth.uid() OR chats.user2_id = auth.uid())));
CREATE POLICY "Users can send messages in their chats" ON public.messages AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = sender_id) AND (EXISTS (SELECT 1 FROM chats WHERE chats.id = messages.chat_id AND (chats.user1_id = auth.uid() OR chats.user2_id = auth.uid()))));
CREATE POLICY "Admins can view all messages" ON public.messages AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete any message" ON public.messages AS PERMISSIVE FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Super admins manage all messages" ON public.messages AS PERMISSIVE FOR ALL TO authenticated USING (has_super_admin(auth.uid())) WITH CHECK (has_super_admin(auth.uid()));

-- notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Triggers insert notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications AS PERMISSIVE FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications AS PERMISSIVE FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Triggers insert notifications" ON public.notifications AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- reels
DROP POLICY IF EXISTS "Reels viewable by everyone" ON public.reels;
DROP POLICY IF EXISTS "Users can create own reels" ON public.reels;
DROP POLICY IF EXISTS "Users can update own reels" ON public.reels;
DROP POLICY IF EXISTS "Users can delete own reels" ON public.reels;
DROP POLICY IF EXISTS "Admins can delete any reel" ON public.reels;
CREATE POLICY "Reels viewable by everyone" ON public.reels AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Users can create own reels" ON public.reels AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reels" ON public.reels AS PERMISSIVE FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own reels" ON public.reels AS PERMISSIVE FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can delete any reel" ON public.reels AS PERMISSIVE FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- reel_likes
DROP POLICY IF EXISTS "Reel likes viewable by everyone" ON public.reel_likes;
DROP POLICY IF EXISTS "Users can like reels" ON public.reel_likes;
DROP POLICY IF EXISTS "Users can unlike reels" ON public.reel_likes;
CREATE POLICY "Reel likes viewable by everyone" ON public.reel_likes AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Users can like reels" ON public.reel_likes AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike reels" ON public.reel_likes AS PERMISSIVE FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- reel_comments
DROP POLICY IF EXISTS "Reel comments viewable by everyone" ON public.reel_comments;
DROP POLICY IF EXISTS "Users can create reel comments" ON public.reel_comments;
DROP POLICY IF EXISTS "Users can delete own reel comments" ON public.reel_comments;
CREATE POLICY "Reel comments viewable by everyone" ON public.reel_comments AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Users can create reel comments" ON public.reel_comments AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own reel comments" ON public.reel_comments AS PERMISSIVE FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- reviews
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.reviews;
DROP POLICY IF EXISTS "Users can create their own reviews" ON public.reviews;
CREATE POLICY "Reviews are viewable by everyone" ON public.reviews AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Users can create their own reviews" ON public.reviews AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = reviewer_id);

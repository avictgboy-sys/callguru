
-- Notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  actor_id uuid,
  resource_id text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Index for fast queries
CREATE INDEX idx_notifications_user_unread ON public.notifications (user_id, is_read, created_at DESC);

-- Trigger: on new like → notify post owner
CREATE OR REPLACE FUNCTION public.notify_on_like()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  post_owner uuid;
  actor_name text;
BEGIN
  SELECT user_id INTO post_owner FROM posts WHERE id = NEW.post_id;
  IF post_owner IS NULL OR post_owner = NEW.user_id THEN RETURN NEW; END IF;
  SELECT COALESCE(full_name, 'Someone') INTO actor_name FROM profiles WHERE user_id = NEW.user_id;
  INSERT INTO notifications (user_id, type, title, body, actor_id, resource_id)
  VALUES (post_owner, 'like', actor_name || ' liked your post', NULL, NEW.user_id, NEW.post_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_on_like AFTER INSERT ON public.likes
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_like();

-- Trigger: on new comment → notify post owner
CREATE OR REPLACE FUNCTION public.notify_on_comment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  post_owner uuid;
  actor_name text;
BEGIN
  SELECT user_id INTO post_owner FROM posts WHERE id = NEW.post_id;
  IF post_owner IS NULL OR post_owner = NEW.user_id THEN RETURN NEW; END IF;
  SELECT COALESCE(full_name, 'Someone') INTO actor_name FROM profiles WHERE user_id = NEW.user_id;
  INSERT INTO notifications (user_id, type, title, body, actor_id, resource_id)
  VALUES (post_owner, 'comment', actor_name || ' commented on your post', LEFT(NEW.content, 100), NEW.user_id, NEW.post_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_on_comment AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_comment();

-- Trigger: on new follow → notify followed user
CREATE OR REPLACE FUNCTION public.notify_on_follow()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  actor_name text;
BEGIN
  IF NEW.follower_id = NEW.following_id THEN RETURN NEW; END IF;
  SELECT COALESCE(full_name, 'Someone') INTO actor_name FROM profiles WHERE user_id = NEW.follower_id;
  INSERT INTO notifications (user_id, type, title, body, actor_id, resource_id)
  VALUES (NEW.following_id, 'follow', actor_name || ' started following you', NULL, NEW.follower_id, NEW.follower_id::text);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_on_follow AFTER INSERT ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_follow();

-- Trigger: on new message → notify recipient
CREATE OR REPLACE FUNCTION public.notify_on_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  recipient uuid;
  actor_name text;
  chat_user1 uuid;
  chat_user2 uuid;
BEGIN
  SELECT user1_id, user2_id INTO chat_user1, chat_user2 FROM chats WHERE id = NEW.chat_id;
  IF chat_user1 = NEW.sender_id THEN recipient := chat_user2;
  ELSE recipient := chat_user1; END IF;
  IF recipient IS NULL THEN RETURN NEW; END IF;
  SELECT COALESCE(full_name, 'Someone') INTO actor_name FROM profiles WHERE user_id = NEW.sender_id;
  INSERT INTO notifications (user_id, type, title, body, actor_id, resource_id)
  VALUES (recipient, 'message', actor_name || ' sent you a message', LEFT(NEW.content, 100), NEW.sender_id, NEW.chat_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_on_message AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_message();

-- Function to mark all as read
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  UPDATE notifications SET is_read = true WHERE user_id = auth.uid() AND is_read = false;
END;
$$;

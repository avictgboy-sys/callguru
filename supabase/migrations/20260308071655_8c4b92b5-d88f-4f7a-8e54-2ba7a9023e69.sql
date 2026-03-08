
-- Tighten the notifications INSERT policy: only allow inserts where user_id matches the actor
DROP POLICY "System can insert notifications" ON public.notifications;
CREATE POLICY "Triggers insert notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

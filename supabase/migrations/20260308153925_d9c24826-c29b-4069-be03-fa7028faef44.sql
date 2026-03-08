
-- Trigger to auto-update chats.last_message_text and last_message_at when a message is inserted
CREATE OR REPLACE FUNCTION public.update_chat_last_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.chats
  SET last_message_text = NEW.content,
      last_message_at = NEW.created_at
  WHERE id = NEW.chat_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_chat_last_message ON public.messages;
CREATE TRIGGER trg_update_chat_last_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_chat_last_message();

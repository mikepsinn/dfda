-- The turns of the check-in chat (lib/programs/chat.ts): one row each time a
-- demo patient sends a message, for the daily limit of each company. Every
-- visitor of a demo shares its patient's account, so the limit is per company.
-- It holds no text. Only the server writes and reads it (no policies).
CREATE TABLE IF NOT EXISTS public.program_chat_turns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES public.instances(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_program_chat_turns_instance_created ON public.program_chat_turns (instance_id, created_at);

ALTER TABLE public.program_chat_turns ENABLE ROW LEVEL SECURITY;

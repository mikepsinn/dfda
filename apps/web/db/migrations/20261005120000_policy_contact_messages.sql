-- Enable RLS on contact_messages so anyone can send a message but nobody can read, change or delete
-- messages through the public API. Without it, the public anon key could read every message. The
-- service role bypasses RLS, so admin tools still see them.
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can send a new message, but not one already assigned, resolved or deleted.
-- Inserts must not ask for the row back (no .select() after .insert()): there is no read policy.
DROP POLICY IF EXISTS "Anyone can send a contact message" ON public.contact_messages;
CREATE POLICY "Anyone can send a contact message" ON public.contact_messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (status = 'new' AND assigned_to IS NULL AND resolved_at IS NULL AND deleted_at IS NULL);

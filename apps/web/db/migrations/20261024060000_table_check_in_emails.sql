-- The daily check-in emails that were sent (lib/programs/check-in-email.ts):
-- one row for each enrollment and day in the member's time zone. The sender
-- adds the row before it sends, so that two runs at the same time send one
-- email. Only the server writes and reads it (no policies).
CREATE TABLE IF NOT EXISTS public.check_in_emails (
  enrollment_id UUID NOT NULL REFERENCES public.program_enrollments(id) ON DELETE CASCADE,
  local_date DATE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (enrollment_id, local_date)
);

ALTER TABLE public.check_in_emails ENABLE ROW LEVEL SECURITY;

-- A row of check_in_emails is first a claim (claimed_at) and is marked sent
-- (sent_at) only after the email went. A run that stopped after its claim, for
-- example at the time limit of the scheduler's call, leaves a claim without
-- sent_at; a later run takes it over after some minutes
-- (lib/programs/check-in.ts), so the email of the day is not lost.
ALTER TABLE public.check_in_emails ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();
ALTER TABLE public.check_in_emails ALTER COLUMN sent_at DROP NOT NULL;
ALTER TABLE public.check_in_emails ALTER COLUMN sent_at DROP DEFAULT;

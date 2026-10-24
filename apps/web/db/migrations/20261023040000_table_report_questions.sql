-- Questions that clinicians of a care team ask the report assistant about a
-- biomarker report (lib/care-team/assistant.ts), with its answers and their
-- sources. They are the care team's working record: the clinicians who can
-- see the report read them; the person does not. The server writes them
-- after it checks the clinician, the report and the daily limit. The count of
-- the last day's questions is that limit, so a question counts as soon as it
-- is asked, also when the answer fails.

CREATE TABLE IF NOT EXISTS public.report_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.biomarker_reports(id) ON DELETE CASCADE,
  instance_id UUID NOT NULL REFERENCES public.instances(id) ON DELETE CASCADE,
  asked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  asker_name TEXT NOT NULL CHECK (char_length(asker_name) BETWEEN 1 AND 120),
  question TEXT NOT NULL CHECK (question = btrim(question) AND char_length(question) BETWEEN 1 AND 1000),
  -- The answer's text segments and sources; null until the answer is complete.
  answer JSONB CHECK (answer IS NULL OR jsonb_typeof(answer) = 'object'),
  model TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  answered_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_report_questions_report ON public.report_questions (report_id, created_at);
CREATE INDEX IF NOT EXISTS idx_report_questions_instance ON public.report_questions (instance_id, created_at);

ALTER TABLE public.report_questions ENABLE ROW LEVEL SECURITY;

-- The care team reads the questions about the reports it can see.
DROP POLICY IF EXISTS "Care teams read questions about shared reports" ON public.report_questions;
CREATE POLICY "Care teams read questions about shared reports" ON public.report_questions
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.biomarker_reports r
    WHERE r.id = report_id AND public.care_team_can_see(r.user_id, r.program_id)
  ));

-- Only the server writes them.
REVOKE INSERT, UPDATE, DELETE ON public.report_questions FROM anon, authenticated;

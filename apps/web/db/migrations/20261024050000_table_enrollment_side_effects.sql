-- The side effects that a member tracks in a program, in addition to the
-- program's own check-ins (lib/programs/side-effects.ts). Each one is a
-- rating-scale variable; its values are the member's measurements. The
-- member's daily check-in asks for each one, and the care team sees them
-- with the other logs when the program has care team review. Leaving the
-- program deletes the rows; the measurements stay the member's.
CREATE TABLE IF NOT EXISTS public.enrollment_side_effects (
  enrollment_id UUID NOT NULL REFERENCES public.program_enrollments(id) ON DELETE CASCADE,
  global_variable_id TEXT NOT NULL REFERENCES public.global_variables(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (enrollment_id, global_variable_id)
);

ALTER TABLE public.enrollment_side_effects ENABLE ROW LEVEL SECURITY;

-- Members manage the side effects of their own enrollments. The care team has
-- no policy here: the case page reads them on the server after it checks the
-- care team and the sharing (lib/care-team/data.ts), as it does for the logs.
DROP POLICY IF EXISTS "Users manage the side effects of their enrollments" ON public.enrollment_side_effects;
CREATE POLICY "Users manage the side effects of their enrollments" ON public.enrollment_side_effects
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.program_enrollments e WHERE e.id = enrollment_id AND e.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.program_enrollments e WHERE e.id = enrollment_id AND e.user_id = auth.uid()));

-- Care team review is on by default (decision 2026-10-24): most programs are a
-- clinic's treatment programs. The owner turns it off for a program in which
-- each person chooses whether to share. A program that somebody has joined
-- keeps its setting, so that nobody's agreement changes after they joined.
ALTER TABLE public.instance_programs ALTER COLUMN care_team_review SET DEFAULT true;

UPDATE public.instance_programs p
SET care_team_review = true
WHERE NOT p.care_team_review
  AND NOT EXISTS (SELECT 1 FROM public.program_enrollments e WHERE e.program_id = p.id);

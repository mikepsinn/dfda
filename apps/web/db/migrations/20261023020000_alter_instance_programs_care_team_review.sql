-- A program in which the care team reviews the biomarker reports of every
-- member, such as a clinic's treatment program. Joining it shares the
-- person's reports in it with the instance's care team: the join page says
-- so, and the person stops by leaving the program. In the other programs,
-- each person chooses whether to share, as before.
ALTER TABLE public.instance_programs ADD COLUMN IF NOT EXISTS care_team_review BOOLEAN NOT NULL DEFAULT false;

-- Care teams and biomarker reports of company instances.
--
-- A company still sees totals only (20261011020100_table_instance_programs.sql).
-- A person can also share their program's biomarker reports with the
-- instance's care team: the clinicians that the instance owner adds. Then each
-- clinician of that care team sees the person's name, their enrollment and
-- their reports in that program, can add a report and can sign one off. The
-- person stops sharing at any time, and the care team then loses that access.
-- The owner is not on the care team unless they add themselves.
--
-- The person sees each of their reports as soon as it is saved, with its
-- review status. Nobody else reads a report: no Outcome Label, ranking or
-- company total.

-- 1. The care team of an instance.
CREATE TABLE IF NOT EXISTS public.instance_clinicians (
  instance_id UUID NOT NULL REFERENCES public.instances(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (instance_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_instance_clinicians_user_id ON public.instance_clinicians (user_id);

-- 2. The person's choice to share their reports in a program; null when they do not share.
ALTER TABLE public.program_enrollments ADD COLUMN IF NOT EXISTS shared_with_care_team_at TIMESTAMP WITH TIME ZONE;

-- 3. Biomarker reports: one file of lib/biomarker-report/schema.ts each. The
-- app checks the file before it saves it; title and report_date are copied
-- from it for lists. The reviewer's name comes from their account.
CREATE TABLE IF NOT EXISTS public.biomarker_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES public.instance_programs(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  data JSONB NOT NULL CHECK (jsonb_typeof(data) = 'object'),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 160),
  report_date DATE NOT NULL,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewer_name TEXT CHECK (char_length(reviewer_name) BETWEEN 1 AND 120),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_note TEXT CHECK (char_length(review_note) BETWEEN 1 AND 2000),
  CHECK ((reviewed_at IS NULL) = (reviewer_name IS NULL)),
  CHECK (reviewed_at IS NOT NULL OR (reviewed_by IS NULL AND review_note IS NULL))
);

CREATE INDEX IF NOT EXISTS idx_biomarker_reports_user_program ON public.biomarker_reports (user_id, program_id);
CREATE INDEX IF NOT EXISTS idx_biomarker_reports_program_id ON public.biomarker_reports (program_id);

-- Whether the signed-in user is on the instance's care team.
CREATE OR REPLACE FUNCTION public.is_care_team_member(p_instance_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE
SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.instance_clinicians c
    WHERE c.instance_id = p_instance_id AND c.user_id = auth.uid()
  )
$$;

-- Whether the signed-in user is on the care team of the program's instance
-- and the person shares their reports in that program.
CREATE OR REPLACE FUNCTION public.care_team_can_see(p_user_id UUID, p_program_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE
SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.program_enrollments e
    JOIN public.instance_programs p ON p.id = e.program_id
    JOIN public.instance_clinicians c ON c.instance_id = p.instance_id
    WHERE e.user_id = p_user_id
      AND e.program_id = p_program_id
      AND e.shared_with_care_team_at IS NOT NULL
      AND c.user_id = auth.uid()
  )
$$;

-- The people who share their reports with the instance's care team, for a
-- clinician of that care team; no rows for anyone else.
CREATE OR REPLACE FUNCTION public.care_team_patients(p_instance_id UUID)
RETURNS TABLE (
  enrollment_id UUID,
  user_id UUID,
  name TEXT,
  email TEXT,
  program_id UUID,
  started_at TIMESTAMP WITH TIME ZONE,
  shared_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql STABLE
SECURITY DEFINER SET search_path = public
AS $$
  SELECT e.id, e.user_id, u.name, pr.email, e.program_id, e.started_at, e.shared_with_care_team_at
  FROM public.program_enrollments e
  JOIN public.instance_programs p ON p.id = e.program_id
  JOIN public.profiles pr ON pr.id = e.user_id
  LEFT JOIN public.users u ON u.id = e.user_id
  WHERE p.instance_id = p_instance_id
    AND e.shared_with_care_team_at IS NOT NULL
    AND pr.deleted_at IS NULL
    AND public.is_care_team_member(p_instance_id)
  ORDER BY u.name, pr.email
$$;

-- A review names the reviewer from their account, and an open report has no review fields.
CREATE OR REPLACE FUNCTION public.set_biomarker_report_reviewer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.reviewed_at IS NULL THEN
    NEW.reviewed_by := NULL;
    NEW.reviewer_name := NULL;
    NEW.review_note := NULL;
  ELSE
    NEW.reviewer_name := (
      SELECT COALESCE(NULLIF(trim(u.name), ''), pr.email)
      FROM public.profiles pr LEFT JOIN public.users u ON u.id = pr.id
      WHERE pr.id = NEW.reviewed_by
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_biomarker_report_reviewer ON public.biomarker_reports;
CREATE TRIGGER set_biomarker_report_reviewer
  BEFORE INSERT OR UPDATE ON public.biomarker_reports
  FOR EACH ROW EXECUTE FUNCTION public.set_biomarker_report_reviewer();

REVOKE EXECUTE ON FUNCTION public.set_biomarker_report_reviewer() FROM PUBLIC, anon, authenticated;

ALTER TABLE public.instance_clinicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.biomarker_reports ENABLE ROW LEVEL SECURITY;

-- The owner manages the care team; a clinician sees the care teams they are on.
DROP POLICY IF EXISTS "Instance owners manage their care team" ON public.instance_clinicians;
CREATE POLICY "Instance owners manage their care team" ON public.instance_clinicians
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.instances i WHERE i.id = instance_id AND i.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.instances i WHERE i.id = instance_id AND i.owner_id = auth.uid()));

DROP POLICY IF EXISTS "Clinicians see their care teams" ON public.instance_clinicians;
CREATE POLICY "Clinicians see their care teams" ON public.instance_clinicians
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- The person reads their own reports. The care team reads, adds, signs off
-- and removes the reports of people who share with it; a signed-off report
-- stays. Nobody else has access.
DROP POLICY IF EXISTS "People read their own reports" ON public.biomarker_reports;
CREATE POLICY "People read their own reports" ON public.biomarker_reports
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Care teams read shared reports" ON public.biomarker_reports;
CREATE POLICY "Care teams read shared reports" ON public.biomarker_reports
  FOR SELECT TO authenticated
  USING (public.care_team_can_see(user_id, program_id));

DROP POLICY IF EXISTS "Care teams add shared reports" ON public.biomarker_reports;
CREATE POLICY "Care teams add shared reports" ON public.biomarker_reports
  FOR INSERT TO authenticated
  WITH CHECK (public.care_team_can_see(user_id, program_id) AND uploaded_by = auth.uid() AND reviewed_at IS NULL);

DROP POLICY IF EXISTS "Care teams sign off shared reports" ON public.biomarker_reports;
CREATE POLICY "Care teams sign off shared reports" ON public.biomarker_reports
  FOR UPDATE TO authenticated
  USING (public.care_team_can_see(user_id, program_id))
  WITH CHECK (public.care_team_can_see(user_id, program_id) AND reviewed_at IS NOT NULL AND reviewed_by = auth.uid());

DROP POLICY IF EXISTS "Care teams remove open reports" ON public.biomarker_reports;
CREATE POLICY "Care teams remove open reports" ON public.biomarker_reports
  FOR DELETE TO authenticated
  USING (public.care_team_can_see(user_id, program_id) AND reviewed_at IS NULL);

-- A sign-off changes only the review; the file, the person and the program stay as saved.
REVOKE UPDATE ON public.biomarker_reports FROM anon, authenticated;
GRANT UPDATE (reviewed_by, reviewed_at, review_note) ON public.biomarker_reports TO authenticated;

-- The clinician's decision when they sign off a biomarker report: continue the
-- current plan, adjust it, investigate a finding first, or not enough
-- information to decide. The care team sees it in its patient list and on the
-- report; the person sees the reviewer, the date and the note, as before.
-- Reviews from before this column have no decision.
ALTER TABLE public.biomarker_reports
  ADD COLUMN IF NOT EXISTS review_decision TEXT
  CHECK (review_decision IN ('continue', 'adjust', 'investigate', 'insufficient'));

-- An open report has no decision.
ALTER TABLE public.biomarker_reports DROP CONSTRAINT IF EXISTS biomarker_reports_open_report_has_no_decision;
ALTER TABLE public.biomarker_reports ADD CONSTRAINT biomarker_reports_open_report_has_no_decision
  CHECK (reviewed_at IS NOT NULL OR review_decision IS NULL);

-- As before, with the decision: an open report has no review fields.
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
    NEW.review_decision := NULL;
  ELSIF NEW.reviewed_by IS NOT NULL THEN
    NEW.reviewer_name := (
      SELECT COALESCE(NULLIF(trim(u.name), ''), pr.email)
      FROM public.profiles pr LEFT JOIN public.users u ON u.id = pr.id
      WHERE pr.id = NEW.reviewed_by
    );
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_biomarker_report_reviewer() FROM PUBLIC, anon, authenticated;

-- A sign-off sets the decision with the other review fields.
GRANT UPDATE (review_decision) ON public.biomarker_reports TO authenticated;

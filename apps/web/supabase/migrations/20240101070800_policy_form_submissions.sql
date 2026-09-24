DROP POLICY IF EXISTS "Allow patient to view their submissions" ON public.form_submissions;
CREATE POLICY "Allow patient to view their submissions" ON public.form_submissions
  FOR SELECT USING (form_submissions.patient_id = auth.uid());

DROP POLICY IF EXISTS "Allow patient to insert their submissions" ON public.form_submissions;
CREATE POLICY "Allow patient to insert their submissions" ON public.form_submissions
  FOR INSERT WITH CHECK (form_submissions.patient_id = auth.uid());

-- Typically submissions are not updated or deleted, but enabling for the patient owner for now.
DROP POLICY IF EXISTS "Allow patient to update their submissions" ON public.form_submissions;
CREATE POLICY "Allow patient to update their submissions" ON public.form_submissions
  FOR UPDATE USING (form_submissions.patient_id = auth.uid()) WITH CHECK (form_submissions.patient_id = auth.uid());

DROP POLICY IF EXISTS "Allow patient to delete their submissions" ON public.form_submissions;
CREATE POLICY "Allow patient to delete their submissions" ON public.form_submissions
  FOR DELETE USING (form_submissions.patient_id = auth.uid());

-- TODO: Consider adding SELECT policy for form creators or related roles (e.g., providers). 
DROP POLICY IF EXISTS "Allow related patient to view answers" ON public.form_answers;
CREATE POLICY "Allow related patient to view answers" ON public.form_answers
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.form_submissions fs
    WHERE fs.id = form_answers.submission_id AND fs.patient_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Allow related patient to insert answers" ON public.form_answers;
CREATE POLICY "Allow related patient to insert answers" ON public.form_answers
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.form_submissions fs
    WHERE fs.id = form_answers.submission_id AND fs.patient_id = auth.uid()
  ));

-- Allowing updates/deletes for answers based on submission ownership.
DROP POLICY IF EXISTS "Allow related patient to update answers" ON public.form_answers;
CREATE POLICY "Allow related patient to update answers" ON public.form_answers
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.form_submissions fs
    WHERE fs.id = form_answers.submission_id AND fs.patient_id = auth.uid()
  )) WITH CHECK (EXISTS (
    SELECT 1 FROM public.form_submissions fs
    WHERE fs.id = form_answers.submission_id AND fs.patient_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Allow related patient to delete answers" ON public.form_answers;
CREATE POLICY "Allow related patient to delete answers" ON public.form_answers
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.form_submissions fs
    WHERE fs.id = form_answers.submission_id AND fs.patient_id = auth.uid()
  ));

-- TODO: Consider adding SELECT policy for form creators or related roles based on the submission. 
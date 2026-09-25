DROP POLICY IF EXISTS "Allow logged-in users to view form questions" ON public.form_questions;
CREATE POLICY "Allow logged-in users to view form questions" ON public.form_questions
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow form creator to insert questions" ON public.form_questions;
CREATE POLICY "Allow form creator to insert questions" ON public.form_questions
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.forms
    WHERE id = form_questions.form_id AND created_by = auth.uid()
  ));

DROP POLICY IF EXISTS "Allow form creator to update questions" ON public.form_questions;
CREATE POLICY "Allow form creator to update questions" ON public.form_questions
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.forms
    WHERE id = form_questions.form_id AND created_by = auth.uid()
  )) WITH CHECK (EXISTS (
    SELECT 1 FROM public.forms
    WHERE id = form_questions.form_id AND created_by = auth.uid()
  ));

DROP POLICY IF EXISTS "Allow form creator to delete questions" ON public.form_questions;
CREATE POLICY "Allow form creator to delete questions" ON public.form_questions
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.forms
    WHERE id = form_questions.form_id AND created_by = auth.uid()
  )); 
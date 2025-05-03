DROP POLICY IF EXISTS "Allow logged-in users to view forms" ON public.forms;
CREATE POLICY "Allow logged-in users to view forms" ON public.forms
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow creator to insert forms" ON public.forms;
CREATE POLICY "Allow creator to insert forms" ON public.forms
  FOR INSERT WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Allow creator to update forms" ON public.forms;
CREATE POLICY "Allow creator to update forms" ON public.forms
  FOR UPDATE USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Allow creator to delete forms" ON public.forms;
CREATE POLICY "Allow creator to delete forms" ON public.forms
  FOR DELETE USING (auth.uid() = created_by); 
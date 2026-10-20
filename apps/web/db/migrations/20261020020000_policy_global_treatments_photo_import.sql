-- The photo import on the patient dashboard
-- (lib/actions/save-variable-measurements-from-image.ts) saves the details of a
-- treatment as the signed-in user, with an upsert into global_treatments. The
-- same rules as for food details (global_foods): signed-in users can add the
-- details of a treatment, and a user who tracks the treatment can change them.
-- Nobody but the full-access client deletes them. Reads stay as in
-- 20261020010000_policy_catalog_tables.sql.

DROP POLICY IF EXISTS "Signed-in users can add treatment details" ON public.global_treatments;
CREATE POLICY "Signed-in users can add treatment details" ON public.global_treatments
  FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users who track a treatment can change its details" ON public.global_treatments;
CREATE POLICY "Users who track a treatment can change its details" ON public.global_treatments
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_variables uv
    WHERE uv.global_variable_id = global_treatments.id AND uv.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_variables uv
    WHERE uv.global_variable_id = global_treatments.id AND uv.user_id = auth.uid()
  ));

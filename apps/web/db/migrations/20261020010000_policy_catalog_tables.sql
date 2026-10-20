-- Row-level security for the shared catalog: variable and unit categories,
-- units, global variables, conditions, treatments, pharmacies and OAuth scopes.
-- bootstrap.sql grants the anon and authenticated roles all privileges on
-- public tables and lets row-level security limit the rows. These tables had
-- none, so a query as a visitor or a signed-in user could change or delete
-- shared rows, for example the conversion factor of a unit.
--
-- Everyone can read them. Signed-in users can add a global variable, as the
-- photo import does (lib/actions/save-variable-measurements-from-image.ts); a
-- trigger adds its first synonym. Only the full-access client (seeds,
-- migrations, scripts) changes or deletes rows. tests/db/catalog-tables.test.ts
-- also checks that every table in the public schema has row-level security.

ALTER TABLE public.variable_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read variable categories" ON public.variable_categories;
CREATE POLICY "Anyone can read variable categories" ON public.variable_categories
  FOR SELECT TO anon, authenticated
  USING (true);

ALTER TABLE public.unit_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read unit categories" ON public.unit_categories;
CREATE POLICY "Anyone can read unit categories" ON public.unit_categories
  FOR SELECT TO anon, authenticated
  USING (true);

ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read units" ON public.units;
CREATE POLICY "Anyone can read units" ON public.units
  FOR SELECT TO anon, authenticated
  USING (true);

ALTER TABLE public.global_variables ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read global variables" ON public.global_variables;
CREATE POLICY "Anyone can read global variables" ON public.global_variables
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Signed-in users can add global variables" ON public.global_variables;
CREATE POLICY "Signed-in users can add global variables" ON public.global_variables
  FOR INSERT TO authenticated
  WITH CHECK (true);

ALTER TABLE public.global_conditions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read global conditions" ON public.global_conditions;
CREATE POLICY "Anyone can read global conditions" ON public.global_conditions
  FOR SELECT TO anon, authenticated
  USING (true);

ALTER TABLE public.global_treatments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read global treatments" ON public.global_treatments;
CREATE POLICY "Anyone can read global treatments" ON public.global_treatments
  FOR SELECT TO anon, authenticated
  USING (true);

ALTER TABLE public.pharmacies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read pharmacies" ON public.pharmacies;
CREATE POLICY "Anyone can read pharmacies" ON public.pharmacies
  FOR SELECT TO anon, authenticated
  USING (true);

ALTER TABLE public.oauth_scopes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read OAuth scopes" ON public.oauth_scopes;
CREATE POLICY "Anyone can read OAuth scopes" ON public.oauth_scopes
  FOR SELECT TO anon, authenticated
  USING (true);

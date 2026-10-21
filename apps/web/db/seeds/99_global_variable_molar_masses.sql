-- The molar masses (g/mol) of the lab tests that labs report either as mass
-- (mg/dL) or as amount (mmol/L, µmol/L) per volume, so that a value converts
-- between the two (lib/units/convert.ts). A test without a molar mass
-- converts only within its own kind. Also in migration 20261021060000 for
-- existing databases. This file runs after the files that add the variables.
--
-- Triglycerides use triolein (885.7), as laboratories do (88.57 mg/dL per
-- mmol/L). Blood urea nitrogen uses the two nitrogen atoms of urea (28.014),
-- so that mg/dL of urea nitrogen converts to mmol/L of urea.
UPDATE public.global_variables AS g
SET molar_mass = m.molar_mass
FROM (VALUES
  ('blood-glucose', 180.156),
  ('fasting-blood-glucose', 180.156),
  ('postprandial-glucose', 180.156),
  ('total-cholesterol', 386.654),
  ('ldl-cholesterol', 386.654),
  ('hdl-cholesterol', 386.654),
  ('triglycerides', 885.7),
  ('creatinine', 113.12),
  ('uric-acid', 168.11),
  ('blood-urea-nitrogen-bun', 28.014),
  ('blood-potassium', 39.098),
  ('salicylate-level', 138.12)
) AS m (id, molar_mass)
WHERE g.id = m.id;

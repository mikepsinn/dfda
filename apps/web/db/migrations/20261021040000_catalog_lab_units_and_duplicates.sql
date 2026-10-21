-- Corrects the lab-test variables of the catalog: the units of the tests, the
-- units of the effects that the AI-generated relationships give for them, and
-- four tests that had two variables each. The seed files have the corrected
-- rows, so a new database gets them from db/seeds; this gives them to every
-- existing database.
--
-- As in 20261011020000_catalog_lab_markers_and_peptides.sql, this runs only
-- when the catalog is already seeded.
DO $$
DECLARE
  pair record;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.variable_categories WHERE id = 'health-and-physiology') THEN
    RETURN;
  END IF;

  -- 1. The units that lab tests are reported in and that the catalog did not have.
  INSERT INTO public.unit_categories (id, name, description, emoji)
  VALUES
    ('velocity', 'Velocity', 'Distance per time (e.g., mm/h for the erythrocyte sedimentation rate)', '🧪'),
    ('international-units-concentration', 'International Units Concentration', 'Biological activity per volume in international units (e.g., µIU/mL)', '🧪'),
    ('filtration-rate', 'Filtration Rate', 'Volume filtered per time per standard body surface area (e.g., mL/min/1.73m²)', '🧪')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.units (id, unit_category_id, name, abbreviated_name, ucum_code, conversion_factor, conversion_offset, emoji)
  VALUES
    ('millimeters-per-hour', 'velocity', 'Millimeters per Hour', 'mm/h', 'mm/h', 1, 0, '🧪'),
    ('micro-international-units-per-milliliter', 'international-units-concentration', 'Micro International Units per Milliliter', 'µIU/mL', 'u[IU]/mL', 1, 0, '🧪'),
    ('picograms-per-milliliter', 'mass-concentration', 'Picograms per Milliliter', 'pg/mL', 'pg/mL', 1000, 0, '🧪'),
    ('milliliters-per-minute-per-1-73-square-meters', 'filtration-rate', 'Milliliters per Minute per 1.73 Square Meters', 'mL/min/1.73m²', 'mL/min/{1.73_m2}', 1, 0, '🧪')
  ON CONFLICT (id) DO NOTHING;

  UPDATE public.unit_categories SET base_unit_id = 'millimeters-per-hour' WHERE id = 'velocity' AND base_unit_id IS NULL;
  UPDATE public.unit_categories SET base_unit_id = 'micro-international-units-per-milliliter' WHERE id = 'international-units-concentration' AND base_unit_id IS NULL;
  UPDATE public.unit_categories SET base_unit_id = 'milliliters-per-minute-per-1-73-square-meters' WHERE id = 'filtration-rate' AND base_unit_id IS NULL;

  -- 2. Merge each test's second variable into the first, which has the test's
  -- LOINC code. Their references move to the first variable, and the second
  -- one's name stays as a synonym. A user's own variable or a program item
  -- for both would conflict; then this fails, and nothing is deleted.
  FOR pair IN
    SELECT * FROM (VALUES
      ('blood-creatinine', 'creatinine'),
      ('fasting-plasma-glucose', 'fasting-blood-glucose'),
      ('c-reactive-protein-crp', 'crp-c-reactive-protein'),
      ('oxygen-saturation-spo2', 'oxygen-saturation')
    ) AS pairs (duplicate_id, kept_id)
  LOOP
    CONTINUE WHEN NOT EXISTS (SELECT 1 FROM public.global_variables WHERE id = pair.duplicate_id)
      OR NOT EXISTS (SELECT 1 FROM public.global_variables WHERE id = pair.kept_id);

    -- A finding that the first variable already has is not moved.
    DELETE FROM public.global_variable_relationships d
    WHERE (d.outcome_global_variable_id = pair.duplicate_id OR d.predictor_global_variable_id = pair.duplicate_id)
      AND EXISTS (
        SELECT 1 FROM public.global_variable_relationships k
        WHERE k.citation_id = d.citation_id
          AND k.condition_id IS NOT DISTINCT FROM d.condition_id
          AND k.outcome_global_variable_id = CASE WHEN d.outcome_global_variable_id = pair.duplicate_id THEN pair.kept_id ELSE d.outcome_global_variable_id END
          AND k.predictor_global_variable_id = CASE WHEN d.predictor_global_variable_id = pair.duplicate_id THEN pair.kept_id ELSE d.predictor_global_variable_id END
      );
    UPDATE public.global_variable_relationships SET outcome_global_variable_id = pair.kept_id WHERE outcome_global_variable_id = pair.duplicate_id;
    UPDATE public.global_variable_relationships SET predictor_global_variable_id = pair.kept_id WHERE predictor_global_variable_id = pair.duplicate_id;

    UPDATE public.user_variables SET global_variable_id = pair.kept_id WHERE global_variable_id = pair.duplicate_id;
    UPDATE public.measurements SET global_variable_id = pair.kept_id WHERE global_variable_id = pair.duplicate_id;
    UPDATE public.instance_program_items SET global_variable_id = pair.kept_id WHERE global_variable_id = pair.duplicate_id;
    UPDATE public.global_variable_codes SET global_variable_id = pair.kept_id WHERE global_variable_id = pair.duplicate_id;
    UPDATE public.global_variables SET canonical_global_variable_id = pair.kept_id WHERE canonical_global_variable_id = pair.duplicate_id;

    INSERT INTO public.global_variable_synonyms (global_variable_id, name)
    SELECT pair.kept_id, name FROM public.global_variable_synonyms WHERE global_variable_id = pair.duplicate_id
    ON CONFLICT (global_variable_id, name) DO NOTHING;

    DELETE FROM public.global_variables WHERE id = pair.duplicate_id;
  END LOOP;

  -- 3. The units of the tests.
  UPDATE public.global_variables AS g SET default_unit_id = fix.unit_id
  FROM (VALUES
    ('creatine-kinase-ck', 'units-per-liter'),
    ('esr-erythrocyte-sedimentation-rate', 'millimeters-per-hour'),
    ('fasting-insulin', 'micro-international-units-per-milliliter'),
    ('crp-c-reactive-protein', 'milligrams-per-liter'),
    ('d-dimer', 'milligrams-per-liter'),
    ('ferritin', 'nanograms-per-milliliter'),
    ('interleukin-6-il-6', 'picograms-per-milliliter'),
    ('ketamine-plasma-concentration', 'nanograms-per-milliliter'),
    ('estimated-glomerular-filtration-rate-egfr', 'milliliters-per-minute-per-1-73-square-meters')
  ) AS fix (variable_id, unit_id)
  WHERE g.id = fix.variable_id;

  -- 4. The units of the AI-generated effects on these tests. Each value is
  -- kept, in the unit that its baseline shows or that makes it a usual
  -- clinical value. A change in multiples of the upper limit of normal has no
  -- unit, so only its percentage stays.
  UPDATE public.global_variable_relationships AS r
  SET absolute_change_unit_id = fix.unit_id,
      baseline_description = COALESCE(fix.baseline, r.baseline_description)
  FROM (VALUES
    ('metformin', 'fasting-insulin', 'per-microliter', 'micro-international-units-per-milliliter', NULL),
    ('adalimumab', 'crp-c-reactive-protein', 'milligrams-per-deciliter', 'milligrams-per-liter', '(baseline: 35 mg/L)'),
    ('tocilizumab', 'crp-c-reactive-protein', 'milligram', 'milligrams-per-liter', '(baseline: 150 mg/L)'),
    ('adalimumab', 'esr-erythrocyte-sedimentation-rate', 'millimeter', 'millimeters-per-hour', NULL),
    ('tocilizumab', 'ferritin', 'microgram', 'nanograms-per-milliliter', '(baseline: 1000 ng/mL)'),
    ('tocilizumab', 'd-dimer', 'milligrams-per-deciliter', 'milligrams-per-liter', '(baseline: 1.0 mg/L)'),
    ('tocilizumab', 'interleukin-6-il-6', 'milligrams-per-deciliter', 'picograms-per-milliliter', '(baseline: 200 pg/mL)'),
    ('ketamine', 'ketamine-plasma-concentration', 'micrograms-per-cubic-meter', 'nanograms-per-milliliter', NULL),
    ('klotho-therapy', 'estimated-glomerular-filtration-rate-egfr', 'milliliter', 'milliliters-per-minute-per-1-73-square-meters', '(baseline: 85 mL/min/1.73m²)')
  ) AS fix (predictor_id, outcome_id, old_unit_id, unit_id, baseline)
  WHERE r.predictor_global_variable_id = fix.predictor_id
    AND r.outcome_global_variable_id = fix.outcome_id
    AND r.absolute_change_unit_id = fix.old_unit_id;

  UPDATE public.global_variable_relationships
  SET absolute_change_value = NULL, absolute_change_unit_id = NULL
  WHERE predictor_global_variable_id = 'atorvastatin-20mg'
    AND outcome_global_variable_id = 'creatine-kinase-ck'
    AND absolute_change_unit_id = 'dimensionless-unit';
END
$$;

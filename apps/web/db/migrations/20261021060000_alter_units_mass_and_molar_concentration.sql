-- Units that convert correctly, and the remaining wrong units of the catalog.
--
-- The "concentration" category held mmol/L as its base, mg/dL with the factor
-- of glucose (18.0182) and g/L with the factor 1. So any test other than
-- glucose converted wrongly between mg/dL and mmol/L, and g/L never converted
-- right. Now mg/dL and g/L are mass concentrations (base ng/mL), the
-- "concentration" category holds amounts per volume (mmol/L, µmol/L), and a
-- value converts between the two only with the molar mass of the test
-- (global_variables.molar_mass; lib/units/convert.ts).
--
-- It also corrects the units of other variables (lung function, joint counts,
-- grip strength, gait speed, doses and frequencies) and of the AI-generated
-- effects on them. A change "vs. placebo" in an event (stroke, mortality) is
-- relative, so it stays only as the percentage change.
--
-- The seed files have the same rows for a new database; the catalog changes
-- below run only when the catalog is already seeded.

ALTER TABLE public.global_variables ADD COLUMN IF NOT EXISTS molar_mass DOUBLE PRECISION CHECK (molar_mass > 0);
COMMENT ON COLUMN public.global_variables.molar_mass IS
  'Molar mass in g/mol, for a test that labs report both as mass and as amount per volume (lib/units/convert.ts).';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.variable_categories WHERE id = 'health-and-physiology') THEN
    RETURN;
  END IF;

  -- 1. Mass and amount per volume.
  UPDATE public.unit_categories
  SET name = 'Molar Concentration',
      description = 'Amount of a substance per volume (e.g., mmol/L, µmol/L); mass units convert to these only with the substance''s molar mass'
  WHERE id = 'concentration';
  UPDATE public.unit_categories
  SET description = 'Mass of a substance per volume (e.g., mg/dL, mg/L, ng/mL)'
  WHERE id = 'mass-concentration';
  UPDATE public.unit_categories
  SET description = 'Distance per time (e.g., mm/h for the erythrocyte sedimentation rate, m/s for gait speed)'
  WHERE id = 'velocity';

  UPDATE public.units SET unit_category_id = 'mass-concentration', conversion_factor = 0.0001 WHERE id = 'milligrams-per-deciliter';
  UPDATE public.units SET unit_category_id = 'mass-concentration', conversion_factor = 0.000001 WHERE id = 'grams-per-liter';

  INSERT INTO public.unit_categories (id, name, description, emoji)
  VALUES ('volume-flow-rate', 'Volume Flow Rate', 'Volume per time (e.g., L/min for the peak expiratory flow)', '💨')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.units (id, unit_category_id, name, abbreviated_name, ucum_code, conversion_factor, conversion_offset, emoji)
  VALUES
    ('micromoles-per-liter', 'concentration', 'Micromoles per Liter', 'µmol/L', 'umol/L', 1000, 0, '🧪'),
    ('liters-per-second', 'volume-flow-rate', 'Liters per Second', 'L/s', 'L/s', 1, 0, '💨'),
    ('liters-per-minute', 'volume-flow-rate', 'Liters per Minute', 'L/min', 'L/min', 60, 0, '💨'),
    ('meters-per-second', 'velocity', 'Meters per Second', 'm/s', 'm/s', 0.0000002777777777777778, 0, '🏃')
  ON CONFLICT (id) DO NOTHING;

  UPDATE public.unit_categories SET base_unit_id = 'liters-per-second' WHERE id = 'volume-flow-rate' AND base_unit_id IS NULL;

  -- 2. Molar masses, as in db/seeds/99_global_variable_molar_masses.sql.
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

  -- 3. Units of other variables.
  UPDATE public.global_variables AS g
  SET default_unit_id = fix.unit_id
  FROM (VALUES
    ('forced-expiratory-volume-in-1-second-fev1', 'liter'),
    ('peak-expiratory-flow-pef', 'liters-per-minute'),
    ('swollen-joint-count', 'dimensionless-unit'),
    ('tender-joint-count', 'dimensionless-unit'),
    ('grip-strength', 'kilogram'),
    ('gait-speed', 'meters-per-second'),
    ('rescue-inhaler-use', 'per-day'),
    ('frequency-of-ibuprofen-use', 'per-day'),
    ('metformin-dosage', 'milligram'),
    ('emergency-room-visits', 'per-month'),
    ('wheezing-episodes', 'per-day'),
    ('medication-adherence', 'percent'),
    ('treatment-adherence', 'percent')
  ) AS fix (variable_id, unit_id)
  WHERE g.id = fix.variable_id;

  -- 4. Units of the AI-generated effects. A change in an event "vs. placebo"
  -- or "vs. standard care" is relative: it stays as the percentage change.
  UPDATE public.global_variable_relationships
  SET absolute_change_value = NULL, absolute_change_unit_id = NULL
  WHERE absolute_change_unit_id = 'percent'
    AND outcome_global_variable_id IN (
      'bleeding-events', 'cardiovascular-events', 'mortality', 'myocardial-infarction-heart-attack',
      'need-for-mechanical-ventilation', 'side-effects', 'stroke', 'suicidal-ideation'
    );

  UPDATE public.global_variable_relationships AS r
  SET absolute_change_unit_id = fix.unit_id,
      baseline_description = COALESCE(fix.baseline, r.baseline_description)
  FROM (VALUES
    ('klotho-therapy', 'healthspan', 'year', 'year-age', NULL),
    ('klotho-therapy', 'lifespan', 'year', 'year-age', NULL),
    ('albuterol', 'peak-expiratory-flow-pef', 'liter', 'liters-per-second', '(baseline: 2.5 L/s)'),
    ('klotho-therapy', 'gait-speed', 'meter', 'meters-per-second', NULL)
  ) AS fix (predictor_id, outcome_id, old_unit_id, unit_id, baseline)
  WHERE r.predictor_global_variable_id = fix.predictor_id
    AND r.outcome_global_variable_id = fix.outcome_id
    AND r.absolute_change_unit_id = fix.old_unit_id;
END
$$;

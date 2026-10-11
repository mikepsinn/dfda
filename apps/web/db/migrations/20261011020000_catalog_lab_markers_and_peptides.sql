-- Catalog rows that the program templates use (lib/programs/templates.ts):
-- blood markers, two peptides, tirzepatide and a self-rated energy level, with
-- the units the markers need.
--
-- A new database gets these rows from db/seeds, which run after the
-- migrations. An existing database (production) has no seed run, so it gets
-- them here. The rows are added only when the catalog is already seeded;
-- otherwise the seed files would later insert the same ids again.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.variable_categories WHERE id = 'health-and-physiology') THEN
    RETURN;
  END IF;

  INSERT INTO public.unit_categories (id, name, description, emoji)
  VALUES
    ('enzyme-activity', 'Enzyme Activity', 'Units of enzyme activity in blood (e.g., U/L)', '🧪'),
    ('mass-concentration', 'Mass Concentration', 'Mass of a substance per volume (e.g., ng/mL, mg/L)', '🧪')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.units (id, unit_category_id, name, abbreviated_name, ucum_code, conversion_factor, conversion_offset, emoji)
  VALUES
    ('units-per-liter', 'enzyme-activity', 'Units per Liter', 'U/L', 'U/L', 1, 0, '🧪'),
    ('nanograms-per-milliliter', 'mass-concentration', 'Nanograms per Milliliter', 'ng/mL', 'ng/mL', 1, 0, '🧪'),
    ('milligrams-per-liter', 'mass-concentration', 'Milligrams per Liter', 'mg/L', 'mg/L', 0.001, 0, '🧪')
  ON CONFLICT (id) DO NOTHING;

  UPDATE public.unit_categories SET base_unit_id = 'units-per-liter' WHERE id = 'enzyme-activity' AND base_unit_id IS NULL;
  UPDATE public.unit_categories SET base_unit_id = 'nanograms-per-milliliter' WHERE id = 'mass-concentration' AND base_unit_id IS NULL;

  INSERT INTO public.global_variables (id, name, description, variable_category_id, default_unit_id, emoji)
  VALUES
    ('hba1c', 'HbA1c', 'Hemoglobin A1c: the average blood sugar over about three months.', 'health-and-physiology', 'percent', '🩸'),
    ('alanine-aminotransferase', 'ALT', 'Alanine aminotransferase, a liver enzyme measured in blood.', 'health-and-physiology', 'units-per-liter', '🩸'),
    ('apolipoprotein-b', 'ApoB', 'Apolipoprotein B: the number of cholesterol-carrying particles that can block arteries.', 'health-and-physiology', 'milligrams-per-deciliter', '🩸'),
    ('ferritin', 'Ferritin', 'Ferritin, a measure of the iron stored in the body.', 'health-and-physiology', 'nanograms-per-milliliter', '🩸'),
    ('c-reactive-protein', 'hs-CRP', 'High-sensitivity C-reactive protein, a marker of inflammation.', 'health-and-physiology', 'milligrams-per-liter', '🩸'),
    ('energy-level', 'Energy', 'Self-rated energy level.', 'mental-and-emotional-state', 'zero-to-ten-scale', '⚡'),
    ('tirzepatide', 'Tirzepatide', 'GIP and GLP-1 receptor agonist used for type 2 diabetes and weight management.', 'intake-and-interventions', 'milligram', '💊'),
    ('bpc-157', 'BPC-157', 'Body Protection Compound-157, a synthetic peptide.', 'intake-and-interventions', 'microgram', '💉'),
    ('tb-500', 'TB-500', 'A synthetic peptide from thymosin beta-4.', 'intake-and-interventions', 'milligram', '💉')
  ON CONFLICT (id) DO NOTHING;
END
$$;

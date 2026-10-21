-- The other catalog rows that the program templates use (lib/programs/config.ts):
-- weight, nausea, pain and semaglutide. They have been in db/seeds since the
-- seeds were written, so a database built from the seeds has them; this makes
-- sure that every existing database has them too, as
-- 20261011020000_catalog_lab_markers_and_peptides.sql does for the newer rows.
-- The demo clinic (lib/demo/clinic.ts) builds its program from these templates.
--
-- As in that migration, the rows are added only when the catalog is already
-- seeded; otherwise the seed files would later insert the same ids again.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.variable_categories WHERE id = 'health-and-physiology') THEN
    RETURN;
  END IF;

  INSERT INTO public.global_variables (id, name, description, variable_category_id, default_unit_id, emoji)
  VALUES
    ('weight', 'Weight', 'Body weight', 'health-and-physiology', 'kilogram', '⚖️'),
    ('nausea', 'Nausea', 'Feeling of sickness with an inclination to vomit', 'health-and-physiology', 'zero-to-ten-scale', '🤢'),
    ('pain', 'Pain', 'Physical discomfort caused by illness or injury, which can be acute or chronic.', 'health-and-physiology', 'zero-to-ten-scale', '😩'),
    ('semaglutide', 'Semaglutide', 'GLP-1 receptor agonist used for the treatment of type 2 diabetes and weight management.', 'intake-and-interventions', 'milligram', '💊')
  ON CONFLICT (id) DO NOTHING;
END $$;

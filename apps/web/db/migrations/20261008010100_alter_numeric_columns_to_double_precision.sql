-- Store measured and rated quantities as double precision.
--
-- Prisma returns NUMERIC columns as Decimal objects, which cannot be passed
-- to client components and need conversion for arithmetic. These columns hold
-- measurements, ratings, conversion factors and nutrition values, where
-- double precision is sufficient. Money columns (trial compensation, product
-- cost and referral fees) stay NUMERIC.
--
-- treatment_ratings_stats depends on treatment_ratings.effectiveness_out_of_ten,
-- so it is dropped and created again. Its counts, and the measurement count in
-- patient_conditions_view, become integers instead of bigint for the same
-- reason (Prisma returns bigint as BigInt).

DROP VIEW public.treatment_ratings_stats;
DROP VIEW public.patient_conditions_view;

ALTER TABLE public.global_foods
  ALTER COLUMN serving_size_quantity TYPE double precision,
  ALTER COLUMN calories_per_serving TYPE double precision,
  ALTER COLUMN fat_per_serving TYPE double precision,
  ALTER COLUMN protein_per_serving TYPE double precision,
  ALTER COLUMN carbs_per_serving TYPE double precision;
ALTER TABLE public.global_variable_relationships
  ALTER COLUMN confidence_interval_level TYPE double precision;
ALTER TABLE public.measurements
  ALTER COLUMN value TYPE double precision;
ALTER TABLE public.patient_side_effects
  ALTER COLUMN severity_out_of_ten TYPE double precision;
ALTER TABLE public.patients
  ALTER COLUMN weight TYPE double precision,
  ALTER COLUMN height TYPE double precision;
ALTER TABLE public.prescriptions
  ALTER COLUMN dosage_amount TYPE double precision;
ALTER TABLE public.reminder_schedules
  ALTER COLUMN default_value TYPE double precision;
ALTER TABLE public.treatment_ratings
  ALTER COLUMN effectiveness_out_of_ten TYPE double precision;
ALTER TABLE public.units
  ALTER COLUMN conversion_factor TYPE double precision,
  ALTER COLUMN conversion_offset TYPE double precision;
ALTER TABLE public.variable_ingredients
  ALTER COLUMN quantity_per_serving TYPE double precision;

CREATE VIEW public.patient_conditions_view AS
SELECT
  pc.id,
  pc.patient_id,
  c.id AS condition_id,
  gv.name AS condition_name,
  gv.description,
  gv.emoji,
  c.icd_code,
  pc.diagnosed_at,
  pc.status,
  pc.severity,
  pc.notes,
  pc.user_variable_id,
  COUNT(m.id)::integer AS measurement_count
FROM public.patient_conditions pc
JOIN public.global_conditions c ON c.id = pc.condition_id
JOIN public.global_variables gv ON gv.id = c.id
LEFT JOIN public.measurements m
  ON m.user_id = pc.patient_id AND m.global_variable_id = c.id AND m.deleted_at IS NULL
WHERE pc.deleted_at IS NULL
  AND c.deleted_at IS NULL
  AND gv.deleted_at IS NULL
GROUP BY
  pc.id,
  pc.patient_id,
  c.id,
  gv.name,
  gv.description,
  gv.emoji,
  c.icd_code,
  pc.diagnosed_at,
  pc.status,
  pc.severity,
  pc.notes,
  pc.user_variable_id;

CREATE VIEW public.treatment_ratings_stats AS
SELECT
  pt.treatment_id,
  pc.condition_id,
  COUNT(tr.id)::integer AS total_ratings,
  AVG(tr.effectiveness_out_of_ten) AS average_effectiveness,
  (COUNT(*) FILTER (WHERE tr.effectiveness_out_of_ten >= 7))::integer AS positive_ratings_count,
  (COUNT(*) FILTER (WHERE tr.effectiveness_out_of_ten <= 3))::integer AS negative_ratings_count,
  (COUNT(*) FILTER (WHERE tr.effectiveness_out_of_ten > 3 AND tr.effectiveness_out_of_ten < 7))::integer AS neutral_ratings_count
FROM public.treatment_ratings tr
JOIN public.patient_treatments pt ON tr.patient_treatment_id = pt.id
JOIN public.patient_conditions pc ON tr.patient_condition_id = pc.id
WHERE tr.deleted_at IS NULL
  AND pc.deleted_at IS NULL
GROUP BY
  pt.treatment_id,
  pc.condition_id;

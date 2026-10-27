-- Symptoms seed file
-- Marks the rating-scale variables that are symptoms (not diseases or scores).
-- The same list as db/migrations/20261026010000_link_symptoms_to_treatments_and_conditions.sql.

INSERT INTO global_symptoms (id)
SELECT id FROM global_variables
WHERE id IN (
  'abdominal-pain', 'chest-pain', 'dizziness', 'dry-cough', 'fatigue', 'headache', 'insomnia',
  'knee-pain', 'low-back-pain', 'muscle-pain', 'nausea', 'pain', 'rash', 'stomach-upset'
)
ON CONFLICT (id) DO NOTHING;

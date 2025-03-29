-- Create patient_treatments view
CREATE OR REPLACE VIEW patient_treatments_view AS
SELECT 
  m.id as measurement_id,
  m.user_id,
  gv.name as variable_name,
  gv.description as variable_description,
  m.value,
  u.name as unit_name,
  u.abbreviated_name as unit_abbreviated_name,
  m.start_at,
  m.end_at,
  m.notes,
  t.id as treatment_id,
  t.name as treatment_name,
  t.treatment_type,
  t.manufacturer,
  t.approval_status
FROM measurements m
JOIN global_variables gv ON gv.id = m.variable_id
JOIN units u ON u.id = m.unit_id
JOIN treatments t ON t.name = gv.name
WHERE m.deleted_at IS NULL
  AND gv.variable_category_id = 'intake-and-interventions'
  AND t.deleted_at IS NULL;
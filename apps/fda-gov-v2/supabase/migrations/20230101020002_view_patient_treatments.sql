-- Create patient_treatments view
CREATE OR REPLACE VIEW patient_treatments_view AS
SELECT 
  m.id as measurement_id,
  m.user_id,
  m.variable_id, -- Keep the original variable_id from measurement
  gv.name as treatment_name, -- Get name from global_variables
  gv.description as treatment_description, -- Get description from global_variables
  m.value,
  u.name as unit_name,
  u.abbreviated_name as unit_abbreviated_name,
  m.start_at,
  m.end_at,
  m.notes,
  t.id as treatment_id, -- This is the same as variable_id in this context
  t.treatment_type,
  t.manufacturer,
  t.approval_status
FROM measurements m
JOIN treatments t ON t.id = m.variable_id -- Join measurement variable to treatment id
JOIN global_variables gv ON gv.id = t.id -- Join treatment to its global_variable definition
JOIN units u ON u.id = m.unit_id
WHERE m.deleted_at IS NULL
  AND gv.variable_category_id = 'intake-and-interventions' -- Ensure it's a treatment/intervention type
  AND t.deleted_at IS NULL -- Ensure the treatment record itself isn't deleted
  AND gv.deleted_at IS NULL; -- Ensure the global variable definition isn't deleted
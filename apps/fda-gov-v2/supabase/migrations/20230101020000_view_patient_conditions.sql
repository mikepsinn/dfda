-- Create patient_conditions view
CREATE OR REPLACE VIEW patient_conditions_view AS
SELECT 
  pc.id,
  pc.patient_id,
  c.id as condition_id,
  gv.name as condition_name, -- Get name from global_variables
  gv.description, -- Get description from global_variables
  c.icd_code,
  pc.diagnosed_at,
  pc.status,
  pc.severity,
  pc.notes,
  COUNT(m.id) as measurement_count
FROM patient_conditions pc
JOIN conditions c ON c.id = pc.condition_id
JOIN global_variables gv ON gv.id = c.id -- Join conditions with global_variables
LEFT JOIN measurements m ON m.user_id = pc.patient_id
WHERE pc.deleted_at IS NULL
  AND c.deleted_at IS NULL
  AND gv.deleted_at IS NULL -- global_variables does now have soft delete
GROUP BY 
  pc.id,
  pc.patient_id,
  c.id,
  gv.name, -- Group by name from global_variables
  gv.description, -- Group by description from global_variables
  c.icd_code,
  pc.diagnosed_at,
  pc.status,
  pc.severity,
  pc.notes;
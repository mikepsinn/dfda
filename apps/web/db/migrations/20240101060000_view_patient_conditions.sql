-- Create patient_conditions view (updated to reflect user_variable_id on patient_conditions)
CREATE OR REPLACE VIEW patient_conditions_view AS
SELECT 
  pc.id,
  pc.patient_id,
  c.id as condition_id,
  gv.name as condition_name, -- Get name from global_variables
  gv.description, -- Get description from global_variables
  gv.emoji,
  c.icd_code,
  pc.diagnosed_at,
  pc.status,
  pc.severity,
  pc.notes,
  pc.user_variable_id, -- Select directly from patient_conditions table
  COUNT(m.id) as measurement_count
FROM patient_conditions pc
JOIN global_conditions c ON c.id = pc.condition_id
JOIN global_variables gv ON gv.id = c.id -- Join conditions with global_variables
-- No longer need LEFT JOIN user_variables
-- LEFT JOIN user_variables uv ON uv.user_id = pc.patient_id AND uv.global_variable_id = c.id AND uv.deleted_at IS NULL
-- Left join measurements - check if this join needs updating based on user_variable_id?
-- For now, keeping it joined on user_id + global_variable_id for consistency with how measurements might be logged
LEFT JOIN measurements m ON m.user_id = pc.patient_id AND m.global_variable_id = c.id AND m.deleted_at IS NULL
WHERE pc.deleted_at IS NULL
  AND c.deleted_at IS NULL
  AND gv.deleted_at IS NULL -- global_variables does now have soft delete
GROUP BY 
  pc.id,
  pc.patient_id,
  c.id,
  gv.name, -- Group by name from global_variables
  gv.description, -- Group by description from global_variables
  gv.emoji,
  c.icd_code,
  pc.diagnosed_at,
  pc.status,
  pc.severity,
  pc.notes,
  pc.user_variable_id; -- Group by the user_variable_id from patient_conditions
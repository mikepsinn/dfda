-- Create patient_conditions view
CREATE OR REPLACE VIEW patient_conditions_view AS
SELECT 
  pc.id,
  pc.patient_id,
  c.id as condition_id,
  c.name as condition_name,
  c.description,
  c.icd_code,
  pc.diagnosed_at,
  pc.status,
  pc.severity,
  pc.notes,
  COUNT(m.id) as measurement_count
FROM patient_conditions pc
JOIN conditions c ON c.id = pc.condition_id
LEFT JOIN measurements m ON m.user_id = pc.patient_id
WHERE pc.deleted_at IS NULL
  AND c.deleted_at IS NULL
GROUP BY 
  pc.id,
  pc.patient_id,
  c.id,
  c.name,
  c.description,
  c.icd_code,
  pc.diagnosed_at,
  pc.status,
  pc.severity,
  pc.notes; 
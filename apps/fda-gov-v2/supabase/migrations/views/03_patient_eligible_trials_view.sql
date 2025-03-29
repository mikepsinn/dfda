-- Create patient_eligible_trials view
CREATE OR REPLACE VIEW patient_eligible_trials_view AS
WITH patient_active_conditions AS (
  SELECT DISTINCT patient_id, condition_id
  FROM patient_conditions
  WHERE status = 'active'
    AND deleted_at IS NULL
)
SELECT 
  pac.patient_id,
  t.id as trial_id,
  t.title,
  t.description,
  t.status,
  t.phase,
  t.start_date,
  t.end_date,
  t.enrollment_target,
  t.current_enrollment,
  c.name as condition_name,
  tr.name as treatment_name,
  tr.treatment_type,
  tr.manufacturer,
  p.first_name as sponsor_first_name,
  p.last_name as sponsor_last_name
FROM patient_active_conditions pac
JOIN trials t ON t.condition_id = pac.condition_id
JOIN conditions c ON c.id = t.condition_id
JOIN treatments tr ON tr.id = t.treatment_id
JOIN profiles p ON p.id = t.sponsor_id
WHERE t.deleted_at IS NULL
  AND t.status IN ('recruiting', 'pending_approval')
  AND t.current_enrollment < t.enrollment_target; 
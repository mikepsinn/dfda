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
  gvc.name as condition_name, -- Get from global_variables
  gvt.name as treatment_name, -- Get from global_variables
  tr.treatment_type,
  tr.manufacturer,
  p.first_name as research_partner_first_name,
  p.last_name as research_partner_last_name
FROM patient_active_conditions pac
JOIN trials t ON t.condition_id = pac.condition_id
JOIN global_conditions c ON c.id = t.condition_id
JOIN global_variables gvc ON gvc.id = c.id -- Join conditions to global_variables
JOIN global_treatments tr ON tr.id = t.treatment_id
JOIN global_variables gvt ON gvt.id = tr.id -- Join treatments to global_variables
JOIN profiles p ON p.id = t.research_partner_id
WHERE t.deleted_at IS NULL
  AND c.deleted_at IS NULL
  AND tr.deleted_at IS NULL
  AND gvc.deleted_at IS NULL -- Add check for global_variables (conditions)
  AND gvt.deleted_at IS NULL -- Add check for global_variables (treatments)
  AND t.status IN ('recruiting', 'pending_approval')
  AND t.current_enrollment < t.enrollment_target;
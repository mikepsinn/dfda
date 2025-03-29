-- Create view for pending actions
CREATE OR REPLACE VIEW pending_actions AS
SELECT 
  a.id,
  a.trial_id,
  t.title as trial_title,
  a.enrollment_id,
  p.first_name || ' ' || p.last_name as patient_name,
  d.first_name || ' ' || d.last_name as doctor_name,
  at.name as action_type,
  at.category as action_category,
  a.title,
  a.description,
  a.status,
  a.priority,
  a.scheduled_date,
  a.due_date,
  a.is_protocol_required,
  pv.version_number as protocol_version,
  CASE 
    WHEN a.due_date < CURRENT_TIMESTAMP THEN 'overdue'
    WHEN a.due_date < CURRENT_TIMESTAMP + INTERVAL '7 days' THEN 'due_soon'
    ELSE 'scheduled'
  END as urgency
FROM trial_actions a
JOIN trials t ON a.trial_id = t.id
JOIN trial_enrollments e ON a.enrollment_id = e.id
JOIN profiles p ON e.patient_id = p.id
JOIN profiles d ON e.doctor_id = d.id
JOIN action_types at ON a.action_type_id = at.id
LEFT JOIN protocol_versions pv ON a.protocol_version_id = pv.id
WHERE 
  a.status IN ('pending', 'scheduled', 'in_progress')
  AND a.deleted_at IS NULL
  AND t.deleted_at IS NULL; 
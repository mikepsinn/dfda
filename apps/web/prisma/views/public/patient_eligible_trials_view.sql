WITH patient_active_conditions AS (
  SELECT
    DISTINCT patient_conditions.patient_id,
    patient_conditions.condition_id
  FROM
    patient_conditions
  WHERE
    (
      (patient_conditions.status = 'active' :: text)
      AND (patient_conditions.deleted_at IS NULL)
    )
)
SELECT
  pac.patient_id,
  t.id AS trial_id,
  t.title,
  t.description,
  t.status,
  t.phase,
  t.start_date,
  t.end_date,
  t.enrollment_target,
  t.current_enrollment,
  gvc.name AS condition_name,
  gvt.name AS treatment_name,
  tr.treatment_type,
  tr.manufacturer,
  p.first_name AS research_partner_first_name,
  p.last_name AS research_partner_last_name
FROM
  (
    (
      (
        (
          (
            (
              patient_active_conditions pac
              JOIN trials t ON ((t.condition_id = pac.condition_id))
            )
            JOIN global_conditions c ON ((c.id = t.condition_id))
          )
          JOIN global_variables gvc ON ((gvc.id = c.id))
        )
        JOIN global_treatments tr ON ((tr.id = t.treatment_id))
      )
      JOIN global_variables gvt ON ((gvt.id = tr.id))
    )
    JOIN profiles p ON ((p.id = t.research_partner_id))
  )
WHERE
  (
    (t.deleted_at IS NULL)
    AND (c.deleted_at IS NULL)
    AND (tr.deleted_at IS NULL)
    AND (gvc.deleted_at IS NULL)
    AND (gvt.deleted_at IS NULL)
    AND (
      t.status = ANY (
        ARRAY ['recruiting'::text, 'pending_approval'::text]
      )
    )
    AND (t.current_enrollment < t.enrollment_target)
  );
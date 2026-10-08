SELECT
  a.id,
  a.trial_id,
  t.title AS trial_title,
  a.enrollment_id,
  ((p.first_name || ' ' :: text) || p.last_name) AS patient_name,
  ((d.first_name || ' ' :: text) || d.last_name) AS provider_name,
  at.name AS action_type,
  at.category AS action_category,
  a.title,
  a.description,
  a.status,
  a.priority,
  a.scheduled_date,
  a.due_date,
  a.is_protocol_required,
  pv.version_number AS protocol_version,
  CASE
    WHEN (a.due_date < CURRENT_TIMESTAMP) THEN 'overdue' :: text
    WHEN (
      a.due_date < (CURRENT_TIMESTAMP + '7 days' :: INTERVAL)
    ) THEN 'due_soon' :: text
    ELSE 'scheduled' :: text
  END AS urgency
FROM
  (
    (
      (
        (
          (
            (
              trial_actions a
              JOIN trials t ON ((a.trial_id = t.id))
            )
            JOIN trial_enrollments e ON ((a.enrollment_id = e.id))
          )
          JOIN profiles p ON ((e.patient_id = p.id))
        )
        JOIN profiles d ON ((e.provider_id = d.id))
      )
      JOIN action_types at ON ((a.action_type_id = at.id))
    )
    LEFT JOIN protocol_versions pv ON ((a.protocol_version_id = pv.id))
  )
WHERE
  (
    (
      a.status = ANY (
        ARRAY ['pending'::text, 'scheduled'::text, 'in_progress'::text]
      )
    )
    AND (a.deleted_at IS NULL)
    AND (t.deleted_at IS NULL)
  );
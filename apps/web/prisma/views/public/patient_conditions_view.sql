SELECT
  pc.id,
  pc.patient_id,
  c.id AS condition_id,
  gv.name AS condition_name,
  gv.description,
  gv.emoji,
  c.icd_code,
  pc.diagnosed_at,
  pc.status,
  pc.severity,
  pc.notes,
  pc.user_variable_id,
  (count(m.id)) :: integer AS measurement_count
FROM
  (
    (
      (
        patient_conditions pc
        JOIN global_conditions c ON ((c.id = pc.condition_id))
      )
      JOIN global_variables gv ON ((gv.id = c.id))
    )
    LEFT JOIN measurements m ON (
      (
        (m.user_id = pc.patient_id)
        AND (m.global_variable_id = c.id)
        AND (m.deleted_at IS NULL)
      )
    )
  )
WHERE
  (
    (pc.deleted_at IS NULL)
    AND (c.deleted_at IS NULL)
    AND (gv.deleted_at IS NULL)
  )
GROUP BY
  pc.id,
  pc.patient_id,
  c.id,
  gv.name,
  gv.description,
  gv.emoji,
  c.icd_code,
  pc.diagnosed_at,
  pc.status,
  pc.severity,
  pc.notes,
  pc.user_variable_id;
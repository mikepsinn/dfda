SELECT
  pt.treatment_id,
  pc.condition_id,
  (count(tr.id)) :: integer AS total_ratings,
  avg(tr.effectiveness_out_of_ten) AS average_effectiveness,
  (
    count(*) FILTER (
      WHERE
        (
          tr.effectiveness_out_of_ten >= (7) :: double precision
        )
    )
  ) :: integer AS positive_ratings_count,
  (
    count(*) FILTER (
      WHERE
        (
          tr.effectiveness_out_of_ten <= (3) :: double precision
        )
    )
  ) :: integer AS negative_ratings_count,
  (
    count(*) FILTER (
      WHERE
        (
          (
            tr.effectiveness_out_of_ten > (3) :: double precision
          )
          AND (
            tr.effectiveness_out_of_ten < (7) :: double precision
          )
        )
    )
  ) :: integer AS neutral_ratings_count
FROM
  (
    (
      treatment_ratings tr
      JOIN patient_treatments pt ON ((tr.patient_treatment_id = pt.id))
    )
    JOIN patient_conditions pc ON ((tr.patient_condition_id = pc.id))
  )
WHERE
  (
    (tr.deleted_at IS NULL)
    AND (pc.deleted_at IS NULL)
  )
GROUP BY
  pt.treatment_id,
  pc.condition_id;
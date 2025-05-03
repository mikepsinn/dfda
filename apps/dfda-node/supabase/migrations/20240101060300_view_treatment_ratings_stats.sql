CREATE VIEW treatment_ratings_stats AS
SELECT
    pt.treatment_id,
    pc.condition_id,
    COUNT(tr.id) AS total_ratings,
    AVG(tr.effectiveness_out_of_ten) AS average_effectiveness,
    COUNT(*) FILTER (WHERE tr.effectiveness_out_of_ten >= 7) AS positive_ratings_count,
    COUNT(*) FILTER (WHERE tr.effectiveness_out_of_ten <= 3) AS negative_ratings_count,
    COUNT(*) FILTER (WHERE tr.effectiveness_out_of_ten > 3 AND tr.effectiveness_out_of_ten < 7) AS neutral_ratings_count
FROM
    treatment_ratings tr
JOIN
    patient_treatments pt ON tr.patient_treatment_id = pt.id
JOIN
    patient_conditions pc ON tr.patient_condition_id = pc.id
WHERE
    tr.deleted_at IS NULL -- Exclude deleted ratings
    AND pc.deleted_at IS NULL -- Ensure patient condition hasn't been deleted
GROUP BY
    pt.treatment_id,
    pc.condition_id; 
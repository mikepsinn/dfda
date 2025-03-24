-- View: personal.n1_trial_severity_analysis

CREATE OR REPLACE VIEW personal.n1_trial_severity_analysis AS
WITH BaselineMeasurements AS (
    SELECT 
        tp.id AS reference_phase_id,
        tp.user_id,
        tp.variable_id,
        tp.start_date,
        tp.end_date,
        AVG(vm.value) AS reference_avg_value,
        STDDEV(vm.value) AS reference_stddev
    FROM personal.n1_trial_phases tp
    JOIN personal.variable_measurements vm ON 
        tp.user_id = vm.user_id AND 
        tp.variable_id = vm.variable_id AND
        vm.measurement_time BETWEEN tp.start_date AND COALESCE(tp.end_date, vm.measurement_time)
    WHERE tp.phase_type IN ('pre_treatment', 'washout', 'stable_period')
    GROUP BY tp.id, tp.user_id, tp.variable_id, tp.start_date, tp.end_date
),
LatestMeasurements AS (
    SELECT DISTINCT ON (user_id, variable_id)
        user_id,
        variable_id,
        value AS latest_value,
        measurement_time AS latest_measurement_time
    FROM personal.variable_measurements
    ORDER BY user_id, variable_id, measurement_time DESC
)
SELECT 
    bm.user_id,
    bm.variable_id,
    gv.name AS variable_name,
    bm.reference_phase_id,
    bm.reference_avg_value,
    bm.reference_stddev,
    lm.latest_value,
    lm.latest_measurement_time,
    (lm.latest_value - bm.reference_avg_value) AS absolute_change,
    CASE 
        WHEN bm.reference_avg_value != 0 
        THEN ((lm.latest_value - bm.reference_avg_value) / ABS(bm.reference_avg_value)) * 100 
        ELSE NULL 
    END AS percent_change,
    CASE
        WHEN (lm.latest_value - bm.reference_avg_value) <= -2 * bm.reference_stddev THEN 'much_improved'
        WHEN (lm.latest_value - bm.reference_avg_value) <= -1 * bm.reference_stddev THEN 'improved'
        WHEN (lm.latest_value - bm.reference_avg_value) BETWEEN -1 * bm.reference_stddev AND bm.reference_stddev THEN 'no_change'
        WHEN (lm.latest_value - bm.reference_avg_value) >= 2 * bm.reference_stddev THEN 'much_worsened'
        WHEN (lm.latest_value - bm.reference_avg_value) >= bm.reference_stddev THEN 'worsened'
    END AS calculated_severity_change
FROM BaselineMeasurements bm
JOIN reference.variables gv ON bm.variable_id = gv.id
LEFT JOIN LatestMeasurements lm ON bm.user_id = lm.user_id AND bm.variable_id = lm.variable_id;

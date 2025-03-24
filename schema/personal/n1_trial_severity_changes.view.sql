-- View: personal.n1_trial_severity_changes

CREATE OR REPLACE VIEW personal.n1_trial_severity_changes AS
WITH BaselineStats AS (
    SELECT 
        tp.id AS reference_phase_id,
        tp.user_id,
        tp.variable_id,
        AVG(vm.value) AS reference_value,
        STDDEV(vm.value) AS reference_stddev
    FROM personal.n1_trial_phases tp
    JOIN personal.variable_measurements vm ON 
        tp.user_id = vm.user_id AND 
        tp.variable_id = vm.variable_id AND
        vm.measurement_time BETWEEN tp.start_date AND COALESCE(tp.end_date, vm.measurement_time)
    WHERE tp.phase_type IN ('pre_treatment', 'washout', 'stable_period')
    GROUP BY tp.id, tp.user_id, tp.variable_id
)
SELECT 
    vm.id,
    vm.user_id,
    vm.variable_id,
    bs.reference_phase_id,
    vm.measurement_time,
    bs.reference_value,
    vm.value AS current_value,
    vm.unit_id,
    (vm.value - bs.reference_value) AS absolute_change,
    CASE 
        WHEN bs.reference_value != 0 
        THEN ((vm.value - bs.reference_value) / ABS(bs.reference_value)) * 100 
        ELSE NULL 
    END AS percent_change,
    CASE
        WHEN (vm.value - bs.reference_value) <= -2 * bs.reference_stddev THEN 'much_improved'
        WHEN (vm.value - bs.reference_value) <= -1 * bs.reference_stddev THEN 'improved'
        WHEN (vm.value - bs.reference_value) BETWEEN -1 * bs.reference_stddev AND bs.reference_stddev THEN 'no_change'
        WHEN (vm.value - bs.reference_value) >= 2 * bs.reference_stddev THEN 'much_worsened'
        WHEN (vm.value - bs.reference_value) >= bs.reference_stddev THEN 'worsened'
    END AS severity_change,
    CASE
        WHEN ABS(vm.value - bs.reference_value) >= 2 * bs.reference_stddev THEN true
        ELSE false
    END AS is_clinically_significant,
    NULL::text as notes,
    vm.created_at,
    vm.updated_at
FROM personal.variable_measurements vm
CROSS JOIN LATERAL (
    SELECT * FROM BaselineStats 
    WHERE user_id = vm.user_id AND variable_id = vm.variable_id
    ORDER BY reference_phase_id DESC
    LIMIT 1
) bs;

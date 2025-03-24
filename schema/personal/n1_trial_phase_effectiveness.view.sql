-- View: personal.n1_trial_phase_effectiveness

CREATE OR REPLACE VIEW personal.n1_trial_phase_effectiveness AS
WITH PhaseStats AS (
    SELECT 
        tp.id AS phase_id,
        tp.user_id,
        tp.variable_id,
        tp.phase_type,
        tp.intervention_variable_id,
        tp.target_dosage,
        tp.adherence_rate,
        tp.effectiveness_rating,
        AVG(vm.value) as avg_value,
        STDDEV(vm.value) as stddev_value,
        COUNT(*) as measurement_count,
        MIN(vm.measurement_time) as first_measurement,
        MAX(vm.measurement_time) as last_measurement
    FROM personal.n1_trial_phases tp
    JOIN personal.variable_measurements vm ON 
        vm.user_id = tp.user_id 
        AND vm.variable_id = vm.variable_id
        AND vm.measurement_time BETWEEN tp.start_date AND COALESCE(tp.end_date, NOW())
    GROUP BY tp.id, tp.user_id, tp.variable_id, tp.phase_type, 
             tp.intervention_variable_id, tp.target_dosage, 
             tp.adherence_rate, tp.effectiveness_rating
)
SELECT 
    ps.*,
    gv.name as variable_name,
    iv.name as intervention_name,
    CASE 
        WHEN cp.avg_value IS NOT NULL THEN 
            ((ps.avg_value - cp.avg_value) / NULLIF(cp.stddev_value, 0))
        ELSE NULL
    END as effect_size,
    CASE
        WHEN ps.phase_type = 'experimental' THEN
            ps.adherence_rate * ps.effectiveness_rating / 100.0
        ELSE NULL
    END as effectiveness_score
FROM PhaseStats ps
JOIN reference.variables gv ON ps.variable_id = gv.id
LEFT JOIN reference.variables iv ON ps.intervention_variable_id = iv.id
LEFT JOIN PhaseStats cp ON cp.id = (
    SELECT tp2.comparison_phase_id 
    FROM personal.n1_trial_phases tp2 
    WHERE tp2.id = ps.phase_id
);

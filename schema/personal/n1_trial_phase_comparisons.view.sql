-- View: personal.n1_trial_phase_comparisons

CREATE OR REPLACE VIEW personal.n1_trial_phase_comparisons AS
WITH PhaseStats AS (
    SELECT 
        tp.id AS phase_id,
        tp.user_id,
        tp.variable_id,
        tp.start_date,
        tp.end_date,
        AVG(vm.value) AS mean_value,
        STDDEV(vm.value) AS stddev_value,
        COUNT(*) as measurement_count
    FROM personal.n1_trial_phases tp
    JOIN personal.variable_measurements vm ON 
        vm.user_id = tp.user_id AND 
        vm.variable_id = tp.variable_id AND
        vm.measurement_time BETWEEN tp.start_date AND COALESCE(tp.end_date, NOW())
    GROUP BY tp.id, tp.user_id, tp.variable_id, tp.start_date, tp.end_date
)
SELECT 
    gen_random_uuid() as id,  -- Generate UUID for each row
    ref.user_id,
    ref.variable_id,
    tp_ref.id as reference_phase_id,
    tp_comp.id as comparison_phase_id,
    (comp.mean_value - ref.mean_value) as mean_difference,
    CASE 
        WHEN ref.mean_value != 0 
        THEN ((comp.mean_value - ref.mean_value) / ABS(ref.mean_value)) * 100 
        ELSE NULL 
    END as percent_change,
    CASE 
        WHEN ref.stddev_value != 0 
        THEN (comp.mean_value - ref.mean_value) / ref.stddev_value
        ELSE NULL 
    END as z_score,
    CASE 
        WHEN (ref.stddev_value + comp.stddev_value) / 2 != 0 
        THEN (comp.mean_value - ref.mean_value) / ((ref.stddev_value + comp.stddev_value) / 2)
        ELSE NULL 
    END as effect_size,
    CASE
        WHEN ABS(comp.mean_value - ref.mean_value) >= 2 * ref.stddev_value THEN true
        ELSE false
    END as is_clinically_significant,
    jsonb_build_object(
        'reference_measurements', ref.measurement_count,
        'comparison_measurements', comp.measurement_count,
        'reference_period', (ref.end_date - ref.start_date),
        'comparison_period', (comp.end_date - comp.start_date)
    ) as clinical_significance_criteria,
    -- Temporal analysis (calculated when possible)
    CASE 
        WHEN comp.start_date > ref.end_date 
        THEN comp.start_date - ref.end_date
        ELSE NULL 
    END as onset_delay,
    NULL::interval as peak_effect_time, -- Would need more detailed analysis
    CASE 
        WHEN comp.end_date IS NOT NULL 
        THEN comp.end_date - comp.start_date
        ELSE NULL 
    END as duration_of_action,
    now() as analysis_timestamp,
    jsonb_build_object(
        'reference_stats', jsonb_build_object('mean', ref.mean_value, 'stddev', ref.stddev_value),
        'comparison_stats', jsonb_build_object('mean', comp.mean_value, 'stddev', comp.stddev_value)
    ) as analysis_parameters,
    NULL::text as notes,
    now() as created_at,
    now() as updated_at
FROM personal.n1_trial_phases tp_ref
JOIN PhaseStats ref ON ref.phase_id = tp_ref.id
JOIN personal.n1_trial_phases tp_comp ON tp_comp.id = tp_ref.comparison_phase_id
JOIN PhaseStats comp ON comp.phase_id = tp_comp.id
WHERE tp_ref.id != tp_comp.id;

-- View: personal.n1_trial_intervention_effectiveness

CREATE OR REPLACE VIEW personal.n1_trial_intervention_effectiveness AS
SELECT 
    tp.id as phase_id,
    tp.user_id,
    tp.intervention_variable_id,
    gv.name as intervention_name,
    tp.target_dosage,
    tp.cost_per_unit,
    tp.total_cost,
    tp.effectiveness_rating,
    tp.adherence_rate,
    -- Cost effectiveness metrics
    CASE 
        WHEN tp.effectiveness_rating > 0 THEN
            tp.total_cost / tp.effectiveness_rating
        ELSE NULL
    END as cost_per_effectiveness_point,
    CASE 
        WHEN tp.adherence_rate > 0 THEN
            tp.total_cost / (tp.adherence_rate * tp.effectiveness_rating / 100.0)
        ELSE NULL
    END as adjusted_cost_effectiveness
FROM personal.n1_trial_phases tp
JOIN reference.variables gv ON tp.intervention_variable_id = gv.id
WHERE tp.phase_type = 'experimental'
AND tp.total_cost IS NOT NULL
AND tp.effectiveness_rating IS NOT NULL;

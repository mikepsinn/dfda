-- Daily metabolic impact view
CREATE MATERIALIZED VIEW models.daily_metabolic_impact AS
SELECT 
    so.parameter_set_id,
    so.population_segment_id,
    so.intervention_variable_id,
    so.value as muscle_gain_lbs,
    (so.value * p.parameters->>'muscle_calorie_burn_rate')::numeric as calories_per_day,
    ps.confidence_interval_low * (p.parameters->>'muscle_calorie_burn_rate')::numeric as min_calories,
    ps.confidence_interval_high * (p.parameters->>'muscle_calorie_burn_rate')::numeric as max_calories
FROM models.simulation_outputs so
JOIN models.parameter_sets p ON p.id = so.parameter_set_id
JOIN models.parameter_sources ps ON ps.intervention_effect_id = so.id
WHERE so.outcome_variable_id IN (
    SELECT id FROM reference.variables 
    WHERE name = 'muscle_mass_gain'
);

-- Annual metabolic impact view
CREATE MATERIALIZED VIEW models.annual_metabolic_impact AS
SELECT 
    parameter_set_id,
    population_segment_id,
    intervention_variable_id,
    calories_per_day * 365 as calories_per_year,
    min_calories * 365 as min_calories_per_year,
    max_calories * 365 as max_calories_per_year
FROM models.daily_metabolic_impact;

-- Health outcomes view
CREATE MATERIALIZED VIEW models.health_outcomes AS
SELECT 
    so.parameter_set_id,
    so.population_segment_id,
    so.intervention_variable_id,
    v.name as outcome_name,
    so.value as effect_size,
    so.confidence_interval_low as min_effect,
    so.confidence_interval_high as max_effect,
    ie.effect_type,
    ps.citation as source
FROM models.simulation_outputs so
JOIN reference.variables v ON v.id = so.outcome_variable_id
JOIN models.intervention_effects ie ON ie.intervention_variable_id = so.intervention_variable_id
    AND ie.outcome_variable_id = so.outcome_variable_id
JOIN models.parameter_sources ps ON ps.intervention_effect_id = ie.id
WHERE v.name IN ('insulin_sensitivity', 'fall_risk', 'mortality_risk');

-- Cost breakdown view
CREATE MATERIALIZED VIEW models.cost_breakdown_summary AS
SELECT 
    cb.parameter_set_id,
    cb.cost_category,
    cb.subcategory,
    pd.age_group,
    pd.population_count,
    pd.risk_multiplier,
    cb.amount * pd.population_count * pd.risk_multiplier as adjusted_amount,
    cb.percentage_of_total,
    ps.citation as source
FROM models.cost_breakdowns cb
JOIN models.population_demographics pd ON pd.population_segment_id = cb.population_segment_id
JOIN models.parameter_sources ps ON ps.parameter_set_id = cb.parameter_set_id;

-- Total economic impact view
CREATE MATERIALIZED VIEW models.total_economic_impact AS
SELECT 
    parameter_set_id,
    SUM(CASE WHEN cost_category = 'healthcare_savings' THEN adjusted_amount ELSE 0 END) as healthcare_savings,
    SUM(CASE WHEN cost_category = 'productivity_gains' THEN adjusted_amount ELSE 0 END) as productivity_gains,
    SUM(CASE WHEN cost_category = 'qaly_value' THEN adjusted_amount ELSE 0 END) as qaly_value,
    SUM(adjusted_amount) as total_impact
FROM models.cost_breakdown_summary
GROUP BY parameter_set_id;

-- Long term projections view
CREATE MATERIALIZED VIEW models.long_term_projections AS
SELECT 
    cb.parameter_set_id,
    p.time_horizon_years,
    p.discount_rate,
    SUM(cb.adjusted_amount * power(1 + p.discount_rate, -t.year)) as present_value
FROM models.cost_breakdown_summary cb
JOIN models.parameter_sets p ON p.id = cb.parameter_set_id
CROSS JOIN generate_series(1, 10) as t(year)
GROUP BY cb.parameter_set_id, p.time_horizon_years, p.discount_rate;

-- QALY impact view
CREATE MATERIALIZED VIEW models.qaly_impact_summary AS
SELECT 
    so.parameter_set_id,
    so.population_segment_id,
    pd.age_group,
    SUM(so.total_qalys * pd.population_count) as total_qalys,
    SUM(so.qaly_monetary_value * so.total_qalys * pd.population_count) as monetary_value,
    MIN(so.confidence_interval_low) as min_qalys,
    MAX(so.confidence_interval_high) as max_qalys
FROM models.simulation_outputs so
JOIN models.population_demographics pd ON pd.population_segment_id = so.population_segment_id
WHERE so.is_qaly_calculation = true
GROUP BY so.parameter_set_id, so.population_segment_id, pd.age_group;

-- Medicare impact view
CREATE MATERIALIZED VIEW models.medicare_impact_summary AS
SELECT 
    cb.parameter_set_id,
    pd.age_group,
    SUM(cb.adjusted_amount) as savings_amount,
    COUNT(DISTINCT pd.population_count) as beneficiary_count,
    SUM(cb.adjusted_amount) / NULLIF(COUNT(DISTINCT pd.population_count), 0) as savings_per_beneficiary
FROM models.cost_breakdown_summary cb
JOIN models.population_demographics pd ON pd.population_segment_id = cb.population_segment_id
WHERE pd.age_group LIKE '%65%' OR pd.age_group LIKE '%75%' OR pd.age_group LIKE '%85%'
GROUP BY cb.parameter_set_id, pd.age_group;

-- Create indexes for the materialized views
CREATE INDEX ON models.daily_metabolic_impact (parameter_set_id);
CREATE INDEX ON models.health_outcomes (parameter_set_id, outcome_name);
CREATE INDEX ON models.cost_breakdown_summary (parameter_set_id, cost_category);
CREATE INDEX ON models.total_economic_impact (parameter_set_id);
CREATE INDEX ON models.qaly_impact_summary (parameter_set_id, age_group);
CREATE INDEX ON models.medicare_impact_summary (parameter_set_id, age_group);

-- Refresh function for all materialized views
CREATE OR REPLACE FUNCTION models.refresh_all_calculation_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY models.daily_metabolic_impact;
    REFRESH MATERIALIZED VIEW CONCURRENTLY models.annual_metabolic_impact;
    REFRESH MATERIALIZED VIEW CONCURRENTLY models.health_outcomes;
    REFRESH MATERIALIZED VIEW CONCURRENTLY models.cost_breakdown_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY models.total_economic_impact;
    REFRESH MATERIALIZED VIEW CONCURRENTLY models.long_term_projections;
    REFRESH MATERIALIZED VIEW CONCURRENTLY models.qaly_impact_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY models.medicare_impact_summary;
END;
$$ LANGUAGE plpgsql;

-- Base intervention effects view
CREATE MATERIALIZED VIEW models.intervention_outcome_effects AS
SELECT 
    so.parameter_set_id,
    so.population_segment_id,
    so.intervention_variable_id,
    iv.name as intervention_name,
    iv.display_name as intervention_display_name,
    so.outcome_variable_id,
    ov.name as outcome_name,
    ov.display_name as outcome_display_name,
    ov.unit_id,
    u.name as unit_name,
    so.value as effect_size,
    so.confidence_interval_low,
    so.confidence_interval_high,
    ie.effect_type,
    ps.citation as source,
    ps.quality_score as evidence_quality,
    vc.name as variable_category
FROM models.simulation_outputs so
JOIN reference.variables iv ON iv.id = so.intervention_variable_id
JOIN reference.variables ov ON ov.id = so.outcome_variable_id
LEFT JOIN reference.units_of_measurement u ON u.id = ov.unit_id
JOIN models.intervention_effects ie ON ie.intervention_variable_id = so.intervention_variable_id
    AND ie.outcome_variable_id = so.outcome_variable_id
JOIN models.parameter_sources ps ON ps.intervention_effect_id = ie.id
JOIN reference.variable_categories vc ON vc.id = ov.category_id;

-- Population adjusted effects view
CREATE MATERIALIZED VIEW models.population_adjusted_effects AS
SELECT 
    e.*,
    pd.age_group,
    pd.population_count,
    pd.risk_multiplier,
    e.effect_size * pd.population_count * pd.risk_multiplier as population_adjusted_effect,
    e.confidence_interval_low * pd.population_count * pd.risk_multiplier as population_adjusted_min,
    e.confidence_interval_high * pd.population_count * pd.risk_multiplier as population_adjusted_max,
    -- Add time-based calculations
    CASE 
        WHEN e.unit_name LIKE '%per day%' THEN e.effect_size * 365
        WHEN e.unit_name LIKE '%per week%' THEN e.effect_size * 52
        WHEN e.unit_name LIKE '%per month%' THEN e.effect_size * 12
        ELSE e.effect_size
    END as annualized_effect
FROM models.intervention_outcome_effects e
JOIN models.population_demographics pd ON pd.population_segment_id = e.population_segment_id;

-- Cost impacts view with NPV calculations
CREATE MATERIALIZED VIEW models.outcome_cost_impacts AS
SELECT 
    e.*,
    cb.cost_category,
    cb.subcategory,
    cb.amount as base_cost,
    cb.amount * e.population_adjusted_effect as cost_impact,
    cb.percentage_of_total,
    p.time_horizon_years,
    p.discount_rate,
    -- Calculate NPV
    cb.amount * e.population_adjusted_effect * 
    (1 - power(1 + p.discount_rate, -p.time_horizon_years)) / 
    NULLIF(p.discount_rate, 0) as npv_impact
FROM models.population_adjusted_effects e
JOIN models.cost_breakdowns cb ON cb.population_segment_id = e.population_segment_id
    AND cb.parameter_set_id = e.parameter_set_id
JOIN models.parameter_sets p ON p.id = e.parameter_set_id;

-- Cascading effects view
CREATE MATERIALIZED VIEW models.cascading_outcome_effects AS
WITH RECURSIVE outcome_chain AS (
    -- Base case: direct effects
    SELECT 
        ioe.intervention_variable_id,
        ioe.intervention_name,
        ioe.outcome_variable_id as variable_id,
        ioe.outcome_name as variable_name,
        ioe.effect_size,
        ioe.confidence_interval_low,
        ioe.confidence_interval_high,
        ioe.unit_name,
        ioe.variable_category,
        1 as effect_level,
        ARRAY[ioe.outcome_variable_id] as effect_path,
        ioe.evidence_quality as min_evidence_quality,
        ioe.parameter_set_id
    FROM models.intervention_outcome_effects ioe

    UNION ALL

    -- Recursive case: secondary effects
    SELECT 
        oc.intervention_variable_id,
        oc.intervention_name,
        vr.dependent_variable_id,
        v.name as dependent_variable_name,
        oc.effect_size * vr.effect_multiplier as cascaded_effect_size,
        oc.confidence_interval_low * vr.effect_multiplier as cascaded_ci_low,
        oc.confidence_interval_high * vr.effect_multiplier as cascaded_ci_high,
        u.name as unit_name,
        vc.name as variable_category,
        oc.effect_level + 1,
        oc.effect_path || vr.dependent_variable_id,
        LEAST(oc.min_evidence_quality, vr.confidence_level) as min_evidence_quality,
        oc.parameter_set_id
    FROM outcome_chain oc
    JOIN reference.variable_relationships vr ON vr.independent_variable_id = oc.variable_id
    JOIN reference.variables v ON v.id = vr.dependent_variable_id
    LEFT JOIN reference.units_of_measurement u ON u.id = v.unit_id
    JOIN reference.variable_categories vc ON vc.id = v.category_id
    WHERE 
        NOT vr.dependent_variable_id = ANY(oc.effect_path)  -- Prevent cycles
        AND oc.effect_level < 3  -- Limit cascade depth to 3 levels
)
SELECT * FROM outcome_chain;

-- Comprehensive population benefits view
CREATE MATERIALIZED VIEW models.population_benefits AS
SELECT 
    ce.intervention_variable_id,
    ce.intervention_name,
    ce.parameter_set_id,
    pd.age_group,
    pd.population_segment_id,
    -- Outcome effects by category
    jsonb_object_agg(
        ce.variable_name,
        jsonb_build_object(
            'direct_effect', CASE WHEN ce.effect_level = 1 THEN ce.effect_size ELSE NULL END,
            'cascaded_effects', jsonb_agg(
                CASE WHEN ce.effect_level > 1 
                THEN jsonb_build_object(
                    'effect_size', ce.effect_size,
                    'effect_level', ce.effect_level,
                    'unit', ce.unit_name,
                    'evidence_quality', ce.min_evidence_quality,
                    'category', ce.variable_category
                )
                ELSE NULL END
            ) FILTER (WHERE ce.effect_level > 1)
        )
    ) as outcome_effects,
    -- Impacts by category
    SUM(CASE WHEN ce.variable_category = 'health_outcome' THEN ce.effect_size * pd.population_count * pd.risk_multiplier ELSE 0 END) as health_impact,
    SUM(CASE WHEN ce.variable_category = 'biomarker' THEN ce.effect_size * pd.population_count * pd.risk_multiplier ELSE 0 END) as biomarker_impact,
    SUM(CASE WHEN ce.variable_category = 'economic_outcome' THEN ce.effect_size * pd.population_count * pd.risk_multiplier ELSE 0 END) as economic_impact,
    SUM(CASE WHEN ce.variable_category = 'productivity' THEN ce.effect_size * pd.population_count * pd.risk_multiplier ELSE 0 END) as productivity_impact,
    SUM(CASE WHEN ce.variable_name = 'qaly_value' THEN ce.effect_size * pd.population_count * pd.risk_multiplier ELSE 0 END) as qaly_impact,
    -- Cost impacts
    SUM(ci.npv_impact) as total_npv_impact,
    SUM(CASE WHEN ci.cost_category = 'healthcare_savings' THEN ci.npv_impact ELSE 0 END) as healthcare_savings_npv,
    SUM(CASE WHEN ci.cost_category = 'productivity_gains' THEN ci.npv_impact ELSE 0 END) as productivity_gains_npv,
    -- Population metrics
    pd.population_count,
    pd.risk_multiplier,
    -- Evidence quality
    MIN(ce.min_evidence_quality) as min_evidence_quality,
    AVG(ce.min_evidence_quality) as avg_evidence_quality,
    COUNT(DISTINCT ce.variable_id) as outcomes_measured
FROM models.cascading_outcome_effects ce
CROSS JOIN models.population_demographics pd
LEFT JOIN models.outcome_cost_impacts ci ON 
    ci.parameter_set_id = ce.parameter_set_id AND
    ci.population_segment_id = pd.population_segment_id
GROUP BY 
    ce.intervention_variable_id,
    ce.intervention_name,
    ce.parameter_set_id,
    pd.age_group,
    pd.population_segment_id,
    pd.population_count,
    pd.risk_multiplier;

-- Create efficient indexes
CREATE INDEX ON models.intervention_outcome_effects (intervention_variable_id, outcome_variable_id);
CREATE INDEX ON models.intervention_outcome_effects (parameter_set_id);
CREATE INDEX ON models.population_adjusted_effects (intervention_variable_id, age_group);
CREATE INDEX ON models.outcome_cost_impacts (intervention_variable_id, cost_category);
CREATE INDEX ON models.cascading_outcome_effects (intervention_variable_id, variable_id);
CREATE INDEX ON models.cascading_outcome_effects (parameter_set_id, effect_level);
CREATE INDEX ON models.population_benefits (intervention_variable_id, parameter_set_id);
CREATE INDEX ON models.population_benefits (age_group);
CREATE INDEX ON models.population_benefits (population_segment_id);

-- Refresh function
CREATE OR REPLACE FUNCTION models.refresh_all_calculation_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY models.intervention_outcome_effects;
    REFRESH MATERIALIZED VIEW CONCURRENTLY models.population_adjusted_effects;
    REFRESH MATERIALIZED VIEW CONCURRENTLY models.outcome_cost_impacts;
    REFRESH MATERIALIZED VIEW CONCURRENTLY models.cascading_outcome_effects;
    REFRESH MATERIALIZED VIEW CONCURRENTLY models.population_benefits;
END;
$$ LANGUAGE plpgsql; 
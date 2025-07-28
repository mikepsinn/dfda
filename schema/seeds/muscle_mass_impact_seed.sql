-- Muscle Mass Impact Analysis Seeder

-- 1. Add necessary variables to reference schema
INSERT INTO reference.variables (name, display_name, description, unit_id, category_id)
VALUES 
    ('muscle_mass_gain', 'Muscle Mass Gain', 'Amount of muscle mass gained through intervention', 
        (SELECT id FROM reference.units_of_measurement WHERE name = 'pounds'),
        (SELECT id FROM reference.variable_categories WHERE name = 'physical_metrics')),
    ('muscle_calorie_burn', 'Muscle Calorie Burn Rate', 'Calories burned per pound of muscle per day',
        (SELECT id FROM reference.units_of_measurement WHERE name = 'calories_per_day'),
        (SELECT id FROM reference.variable_categories WHERE name = 'metabolic_metrics'))
RETURNING id AS muscle_mass_id, (SELECT id FROM reference.variables ORDER BY id DESC LIMIT 1) AS calorie_burn_id;

-- 2. Create parameter set for the analysis
INSERT INTO models.parameter_sets (
    name,
    description,
    parameters,
    time_horizon_years,
    discount_rate
)
VALUES (
    'muscle_mass_impact_2025',
    'Muscle Mass Intervention Analysis - 2025 Baseline',
    jsonb_build_object(
        'muscle_mass_increase', 2.0,
        'muscle_calorie_burn_rate', 8.0,
        'baseline_rmr', 1800,
        'insulin_sensitivity_per_lb', 0.02,
        'fall_risk_reduction_per_lb', 0.015,
        'mortality_reduction_per_lb', 0.01,
        'population_size', 335000000,
        'healthcare_cost_per_fall', 10000,
        'annual_fall_risk', 0.15,
        'annual_healthcare_cost', 11000,
        'productivity_gain_per_lb', 100,
        'qaly_value', 100000
    ),
    10, -- 10 year horizon
    0.03 -- 3% discount rate
)
RETURNING id as param_set_id;

-- 3. Add population demographics
INSERT INTO models.population_demographics (
    parameter_set_id,
    age_group,
    population_count,
    risk_multiplier
)
SELECT 
    param_set_id,
    age_group,
    population_count,
    risk_multiplier
FROM (
    VALUES 
        ('Under 45', 180900000, 0.6),
        ('45-64', 100500000, 1.0),
        ('65-74', 30150000, 1.5),
        ('75-84', 16750000, 2.0),
        ('85+', 6700000, 3.0)
) as demographics(age_group, population_count, risk_multiplier)
CROSS JOIN (SELECT id as param_set_id FROM models.parameter_sets WHERE name = 'muscle_mass_impact_2025') ps;

-- 4. Add intervention effects
INSERT INTO models.intervention_effects (
    intervention_variable_id,
    outcome_variable_id,
    effect_type,
    effect_size,
    confidence_interval_low,
    confidence_interval_high
)
SELECT 
    v_muscle.id as intervention_variable_id,
    v_outcome.id as outcome_variable_id,
    'direct' as effect_type,
    effect_size,
    ci_low,
    ci_high
FROM (
    VALUES 
        ('insulin_sensitivity', 0.04, 0.03, 0.05),
        ('fall_risk', 0.03, 0.023, 0.038),
        ('mortality_risk', 0.02, 0.015, 0.025)
) as effects(outcome_name, effect_size, ci_low, ci_high)
CROSS JOIN (SELECT id FROM reference.variables WHERE name = 'muscle_mass_gain') v_muscle
JOIN reference.variables v_outcome ON v_outcome.name = effects.outcome_name;

-- 5. Add cost breakdowns
INSERT INTO models.cost_breakdowns (
    parameter_set_id,
    population_segment_id,
    cost_category,
    subcategory,
    amount,
    percentage_of_total
)
SELECT 
    ps.id as parameter_set_id,
    pd.id as population_segment_id,
    cost_category,
    subcategory,
    amount,
    percentage_of_total
FROM (
    VALUES 
        ('healthcare_savings', 'fall_related', 16234267500, 15.8),
        ('healthcare_savings', 'diabetes_related', 31429541880, 30.6),
        ('healthcare_savings', 'hospitalization', 7341496525, 7.1),
        ('healthcare_savings', 'mortality_related', 5826298225, 5.7),
        ('healthcare_savings', 'general_utilization', 41848334000, 40.8),
        ('productivity_gains', 'cognitive_performance', 31089649272, 100.0),
        ('qaly_value', 'lifetime_qalys', 4558599600, 100.0)
) as costs(cost_category, subcategory, amount, percentage_of_total)
CROSS JOIN (SELECT id FROM models.parameter_sets WHERE name = 'muscle_mass_impact_2025') ps
CROSS JOIN (SELECT id FROM models.population_demographics LIMIT 1) pd;

-- 6. Add parameter sources
INSERT INTO models.parameter_sources (
    parameter_set_id,
    intervention_effect_id,
    citation,
    quality_score,
    methodology_notes
)
SELECT 
    ps.id as parameter_set_id,
    ie.id as intervention_effect_id,
    'pmc.ncbi.nlm.nih.gov',
    0.85,
    'Based on systematic review and meta-analysis'
FROM models.parameter_sets ps
CROSS JOIN models.intervention_effects ie
WHERE ps.name = 'muscle_mass_impact_2025';

-- 7. Add simulation outputs
INSERT INTO models.simulation_outputs (
    parameter_set_id,
    population_segment_id,
    intervention_variable_id,
    outcome_variable_id,
    value,
    confidence_interval_low,
    confidence_interval_high,
    is_qaly_calculation,
    total_qalys,
    qaly_monetary_value
)
SELECT 
    ps.id as parameter_set_id,
    pd.id as population_segment_id,
    v_muscle.id as intervention_variable_id,
    v_outcome.id as outcome_variable_id,
    2.0 as value, -- 2 lbs muscle mass gain
    1.5 as confidence_interval_low,
    2.5 as confidence_interval_high,
    true as is_qaly_calculation,
    0.01 as total_qalys, -- Based on calculation in report
    100000 as qaly_monetary_value
FROM models.parameter_sets ps
CROSS JOIN models.population_demographics pd
CROSS JOIN (SELECT id FROM reference.variables WHERE name = 'muscle_mass_gain') v_muscle
CROSS JOIN (SELECT id FROM reference.variables WHERE name IN ('insulin_sensitivity', 'fall_risk', 'mortality_risk')) v_outcome
WHERE ps.name = 'muscle_mass_impact_2025'; 
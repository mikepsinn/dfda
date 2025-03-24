-- Comprehensive view for muscle mass impact report
CREATE OR REPLACE VIEW models.muscle_mass_impact_report AS
WITH 
-- Get the parameter set
params AS (
    SELECT 
        id,
        parameters,
        time_horizon_years,
        discount_rate
    FROM models.parameter_sets 
    WHERE name = 'muscle_mass_impact_2025'
),
-- Daily metabolic impact
metabolic_daily AS (
    SELECT 
        dmi.*,
        p.parameters->>'baseline_rmr' as baseline_rmr
    FROM models.daily_metabolic_impact dmi
    CROSS JOIN params p
    WHERE dmi.parameter_set_id = p.id
),
-- Health outcomes summary
health_outcomes AS (
    SELECT 
        outcome_name,
        effect_size,
        min_effect as best_case,
        max_effect as worst_case,
        source
    FROM models.health_outcomes
    WHERE parameter_set_id = (SELECT id FROM params)
),
-- Economic impact summary
economic_impact AS (
    SELECT 
        cost_category,
        subcategory,
        SUM(adjusted_amount) as total_amount,
        STRING_AGG(DISTINCT source, ', ') as sources
    FROM models.cost_breakdown_summary
    WHERE parameter_set_id = (SELECT id FROM params)
    GROUP BY cost_category, subcategory
),
-- Medicare impact
medicare_impact AS (
    SELECT 
        age_group,
        savings_amount,
        savings_per_beneficiary,
        beneficiary_count
    FROM models.medicare_impact_summary
    WHERE parameter_set_id = (SELECT id FROM params)
),
-- QALY impact
qaly_summary AS (
    SELECT 
        SUM(total_qalys) as total_qalys,
        SUM(monetary_value) as monetary_value,
        MIN(min_qalys) as min_qalys,
        MAX(max_qalys) as max_qalys
    FROM models.qaly_impact_summary
    WHERE parameter_set_id = (SELECT id FROM params)
),
-- Long term projections
long_term AS (
    SELECT 
        time_horizon_years,
        discount_rate,
        present_value as total_npv
    FROM models.long_term_projections
    WHERE parameter_set_id = (SELECT id FROM params)
)
SELECT 
    -- Intervention Details
    p.parameters->>'muscle_mass_increase' as muscle_mass_increase_lbs,
    p.parameters->>'population_size' as target_population,
    
    -- Metabolic Impact
    md.calories_per_day as daily_calories_burned,
    md.min_calories as daily_calories_min,
    md.max_calories as daily_calories_max,
    md.baseline_rmr as baseline_metabolic_rate,
    
    -- Health Outcomes
    json_build_object(
        'insulin_sensitivity', (SELECT json_build_object(
            'improvement', effect_size,
            'best_case', best_case,
            'worst_case', worst_case
        ) FROM health_outcomes WHERE outcome_name = 'insulin_sensitivity'),
        'fall_risk', (SELECT json_build_object(
            'reduction', effect_size,
            'best_case', best_case,
            'worst_case', worst_case
        ) FROM health_outcomes WHERE outcome_name = 'fall_risk'),
        'mortality_risk', (SELECT json_build_object(
            'reduction', effect_size,
            'best_case', best_case,
            'worst_case', worst_case
        ) FROM health_outcomes WHERE outcome_name = 'mortality_risk')
    ) as health_outcomes,
    
    -- Economic Impact
    json_build_object(
        'healthcare_savings', (
            SELECT json_object_agg(subcategory, total_amount)
            FROM economic_impact
            WHERE cost_category = 'healthcare_savings'
        ),
        'productivity_gains', (
            SELECT json_object_agg(subcategory, total_amount)
            FROM economic_impact
            WHERE cost_category = 'productivity_gains'
        ),
        'qaly_value', (
            SELECT json_object_agg(subcategory, total_amount)
            FROM economic_impact
            WHERE cost_category = 'qaly_value'
        )
    ) as economic_impact,
    
    -- Medicare Impact
    json_build_object(
        'total_savings', (SELECT SUM(savings_amount) FROM medicare_impact),
        'beneficiary_count', (SELECT SUM(beneficiary_count) FROM medicare_impact),
        'savings_per_beneficiary', (
            SELECT SUM(savings_amount) / NULLIF(SUM(beneficiary_count), 0) 
            FROM medicare_impact
        ),
        'age_distribution', (
            SELECT json_object_agg(age_group, json_build_object(
                'savings', savings_amount,
                'beneficiaries', beneficiary_count
            ))
            FROM medicare_impact
        )
    ) as medicare_impact,
    
    -- QALY Impact
    json_build_object(
        'total_qalys', total_qalys,
        'monetary_value', monetary_value,
        'min_qalys', min_qalys,
        'max_qalys', max_qalys
    ) as qaly_impact,
    
    -- Long Term Impact
    json_build_object(
        'time_horizon_years', time_horizon_years,
        'discount_rate', discount_rate,
        'total_npv', total_npv
    ) as long_term_impact,
    
    -- Metadata
    CURRENT_TIMESTAMP as report_generated_at,
    'v1.0' as report_version
FROM 
    params p
    CROSS JOIN metabolic_daily md
    CROSS JOIN qaly_summary qs
    CROSS JOIN long_term lt;

-- Add helpful comments
COMMENT ON VIEW models.muscle_mass_impact_report IS 'Comprehensive view that generates the complete muscle mass intervention impact analysis report';

-- Create a refresh function for the report
CREATE OR REPLACE FUNCTION models.refresh_muscle_mass_report()
RETURNS void AS $$
BEGIN
    -- Refresh all underlying materialized views
    PERFORM models.refresh_all_calculation_views();
END;
$$ LANGUAGE plpgsql; 
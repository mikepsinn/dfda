-- Function: models.refresh_all_calculation_views

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

-- User Variable Relationship Statistics
--
-- Materialized view that calculates statistical relationships between user variables
-- including correlation coefficients, significance tests, and derived metrics.
--
CREATE MATERIALIZED VIEW personal.user_variable_relationship_stats AS
WITH measurement_stats AS (
    SELECT 
        r.id AS relationship_id,
        r.predictor_variable_id,
        r.outcome_variable_id,
        COUNT(DISTINCT DATE_TRUNC('day', pm.timestamp)) as number_of_days,
        COUNT(DISTINCT pm.id) as number_of_predictor_measurements,
        COUNT(DISTINCT om.id) as number_of_outcome_measurements,
        COUNT(DISTINCT CASE WHEN pm.value > p.average_value THEN DATE_TRUNC('day', pm.timestamp) END) as high_predictor_days,
        COUNT(DISTINCT CASE WHEN pm.value <= p.average_value THEN DATE_TRUNC('day', pm.timestamp) END) as low_predictor_days,
        AVG(CASE WHEN pm.value > p.average_value THEN om.value END) as average_outcome_with_high_predictor,
        AVG(CASE WHEN pm.value <= p.average_value THEN om.value END) as average_outcome_with_low_predictor,
        STDDEV(om.value) as outcome_standard_deviation,
        MIN(pm.timestamp) as earliest_measurement_start_at,
        MAX(pm.timestamp) as latest_measurement_start_at
    FROM personal.user_variable_relationships r
    JOIN personal.measurements pm ON pm.variable_id = r.predictor_variable_id
    JOIN personal.measurements om ON om.variable_id = r.outcome_variable_id
        AND om.timestamp >= pm.timestamp + r.onset_delay
        AND om.timestamp <= pm.timestamp + r.onset_delay + r.duration_of_action
    JOIN personal.user_variables p ON p.variable_id = r.predictor_variable_id
    GROUP BY r.id, r.predictor_variable_id, r.outcome_variable_id
)
SELECT 
    relationship_id,
    predictor_variable_id,
    outcome_variable_id,
    number_of_days,
    number_of_predictor_measurements,
    number_of_outcome_measurements,
    high_predictor_days,
    low_predictor_days,
    average_outcome_with_high_predictor,
    average_outcome_with_low_predictor,
    outcome_standard_deviation,
    earliest_measurement_start_at,
    latest_measurement_start_at,
    -- Calculate statistical significance
    CASE 
        WHEN outcome_standard_deviation = 0 THEN 0
        ELSE (average_outcome_with_high_predictor - average_outcome_with_low_predictor) 
             / (outcome_standard_deviation / SQRT(LEAST(high_predictor_days, low_predictor_days)))
    END as t_statistic,
    -- Calculate correlation strength
    CASE 
        WHEN high_predictor_days + low_predictor_days = 0 THEN 0
        ELSE (average_outcome_with_high_predictor - average_outcome_with_low_predictor) 
             / NULLIF(outcome_standard_deviation, 0)
    END as correlation_strength
FROM measurement_stats;

-- Create indexes for faster querying
CREATE UNIQUE INDEX ON personal.user_variable_relationship_stats(relationship_id);
CREATE INDEX ON personal.user_variable_relationship_stats(predictor_variable_id);
CREATE INDEX ON personal.user_variable_relationship_stats(outcome_variable_id);

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION personal.refresh_user_variable_relationship_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY personal.user_variable_relationship_stats;
END;
$$ LANGUAGE plpgsql;

-- Trigger to refresh stats when measurements are updated
CREATE OR REPLACE FUNCTION personal.trigger_refresh_relationship_stats()
RETURNS trigger AS $$
BEGIN
    PERFORM personal.refresh_user_variable_relationship_stats();
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER refresh_relationship_stats_on_measurement_change
AFTER INSERT OR UPDATE OR DELETE ON personal.measurements
FOR EACH STATEMENT
EXECUTE FUNCTION personal.trigger_refresh_relationship_stats();

COMMENT ON MATERIALIZED VIEW personal.user_variable_relationship_stats IS 'Statistical analysis of relationships between user variables based on measurements';
COMMENT ON COLUMN personal.user_variable_relationship_stats.predictor_variable_id IS 'The variable being analyzed as a potential predictor';
COMMENT ON COLUMN personal.user_variable_relationship_stats.outcome_variable_id IS 'The variable being analyzed for potential correlation with the predictor';
COMMENT ON COLUMN personal.user_variable_relationship_stats.number_of_days IS 'Number of days with measurements for both variables';
COMMENT ON COLUMN personal.user_variable_relationship_stats.average_outcome_with_high_predictor IS 'Average outcome value when predictor is above average';
COMMENT ON COLUMN personal.user_variable_relationship_stats.average_outcome_with_low_predictor IS 'Average outcome value when predictor is below average';
COMMENT ON COLUMN personal.user_variable_relationship_stats.t_statistic IS 'T-statistic for the difference in outcome means between high and low predictor values';
COMMENT ON COLUMN personal.user_variable_relationship_stats.correlation_strength IS 'Standardized effect size (Cohen''s d) of predictor on outcome'; 
-- Trigger: personal.measurements_refresh_relationship_stats_on_measurement_change
-- Original name: refresh_relationship_stats_on_measurement_change

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

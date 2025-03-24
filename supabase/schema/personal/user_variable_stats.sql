-- User Variable Statistics View
--
-- Materialized view that calculates statistics for each user's variables
-- based on their measurements and variable settings
--
CREATE MATERIALIZED VIEW personal.user_variable_stats AS
WITH measurement_stats AS (
    SELECT 
        m.user_id,
        m.variable_id,
        COUNT(*) as number_of_measurements,
        MIN(m.value) as minimum_value,
        MAX(m.value) as maximum_value,
        AVG(m.value) as average_value,
        STDDEV(m.value) as standard_deviation,
        PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY m.value) as percentile_25,
        PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY m.value) as percentile_50,
        PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY m.value) as percentile_75,
        MIN(m.timestamp) as earliest_measurement,
        MAX(m.timestamp) as latest_measurement,
        NOW() - MAX(m.timestamp) as time_since_last_measurement,
        COUNT(DISTINCT DATE_TRUNC('day', m.timestamp)) as number_of_days_with_measurements
    FROM personal.measurements m
    WHERE m.deleted_at IS NULL
    GROUP BY m.user_id, m.variable_id
),
variable_settings AS (
    SELECT 
        uv.user_id,
        uv.variable_id,
        uv.display_name,
        uv.description,
        uv.unit_id,
        uv.default_value,
        uv.minimum_value as user_minimum_value,
        uv.maximum_value as user_maximum_value,
        uv.filling_type,
        uv.joining_type,
        uv.onset_delay,
        uv.duration_of_action,
        uv.analysis_settings
    FROM personal.user_variables uv
    WHERE uv.deleted_at IS NULL
)
SELECT 
    vs.user_id,
    vs.variable_id,
    gv.name as variable_name,
    COALESCE(vs.display_name, gv.display_name) as display_name,
    COALESCE(vs.description, gv.description) as description,
    COALESCE(vs.unit_id, gv.unit_id) as unit_id,
    gv.data_type,
    COALESCE(vs.default_value, gv.default_value) as default_value,
    COALESCE(vs.user_minimum_value, gv.minimum_value) as minimum_allowed_value,
    COALESCE(vs.user_maximum_value, gv.maximum_value) as maximum_allowed_value,
    ms.number_of_measurements,
    ms.minimum_value as minimum_recorded_value,
    ms.maximum_value as maximum_recorded_value,
    ms.average_value,
    ms.standard_deviation,
    ms.percentile_25,
    ms.percentile_50,
    ms.percentile_75,
    ms.earliest_measurement,
    ms.latest_measurement,
    ms.time_since_last_measurement,
    ms.number_of_days_with_measurements,
    COALESCE(vs.filling_type, 'none') as filling_type,
    COALESCE(vs.joining_type, 'none') as joining_type,
    COALESCE(vs.onset_delay, '0'::interval) as onset_delay,
    COALESCE(vs.duration_of_action, '0'::interval) as duration_of_action,
    vs.analysis_settings,
    NOW() as last_updated
FROM variable_settings vs
JOIN reference.variables gv ON vs.variable_id = gv.id
LEFT JOIN measurement_stats ms ON vs.user_id = ms.user_id AND vs.variable_id = ms.variable_id;

-- Create indexes for better query performance
CREATE UNIQUE INDEX idx_user_variable_stats_user_variable
ON personal.user_variable_stats(user_id, variable_id);

CREATE INDEX idx_user_variable_stats_variable
ON personal.user_variable_stats(variable_id);

-- Add comments
COMMENT ON MATERIALIZED VIEW personal.user_variable_stats IS 
'User-specific variable statistics calculated from measurements and variable settings';

-- Create function to refresh the materialized view
CREATE OR REPLACE FUNCTION personal.refresh_user_variable_stats()
RETURNS trigger AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY personal.user_variable_stats;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to refresh the view when measurements or settings change
CREATE TRIGGER refresh_user_variable_stats_measurements
AFTER INSERT OR UPDATE OR DELETE ON personal.measurements
FOR EACH STATEMENT EXECUTE FUNCTION personal.refresh_user_variable_stats();

CREATE TRIGGER refresh_user_variable_stats_variables
AFTER INSERT OR UPDATE OR DELETE ON personal.user_variables
FOR EACH STATEMENT EXECUTE FUNCTION personal.refresh_user_variable_stats(); 
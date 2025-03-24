-- Variable Global Statistics View
--
-- Aggregates variable statistics across all users
-- combining with global variable settings
--
CREATE MATERIALIZED VIEW global.variable_global_stats AS
WITH variable_stats AS (
    SELECT 
        variable_id,
        COUNT(DISTINCT user_id) as number_of_users,
        SUM(measurement_count) as total_measurements,
        MIN(min_value) as global_minimum_value,
        MAX(max_value) as global_maximum_value,
        AVG(avg_value) as average_value_across_users,
        STDDEV(avg_value) as std_dev_between_users,
        AVG(std_dev) as avg_std_dev_within_users,
        MIN(first_tracked_at) as earliest_measurement,
        MAX(last_tracked_at) as latest_measurement,
        AVG(measurements_per_day) as avg_measurements_per_day
    FROM personal.variable_user_stats
    GROUP BY variable_id
)
SELECT 
    gv.id as variable_id,
    gv.name,
    gv.display_name,
    gv.category_id,
    gv.data_type,
    gv.unit_id as default_unit_id,
    gv.default_value,
    gv.minimum_value as global_minimum_allowed,
    gv.maximum_value as global_maximum_allowed,
    vs.number_of_users,
    vs.total_measurements,
    vs.global_minimum_value,
    vs.global_maximum_value,
    vs.average_value_across_users,
    vs.std_dev_between_users,
    vs.avg_std_dev_within_users,
    vs.earliest_measurement,
    vs.latest_measurement,
    vs.avg_measurements_per_day,
    NOW() as last_updated
FROM reference.variables gv
LEFT JOIN variable_stats vs ON gv.id = vs.variable_id
WHERE gv.deleted_at IS NULL;

-- Create indexes for better query performance
CREATE UNIQUE INDEX idx_variable_global_stats_id
ON global.variable_global_stats(variable_id);

CREATE INDEX idx_variable_global_stats_category
ON global.variable_global_stats(category_id);

-- Add comments
COMMENT ON MATERIALIZED VIEW global.variable_global_stats IS 
'Aggregated variable statistics across all users, combined with global settings';

-- Create function to refresh the materialized view
CREATE OR REPLACE FUNCTION global.refresh_variable_global_stats()
RETURNS trigger AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY global.variable_global_stats;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to refresh when underlying data changes
CREATE TRIGGER refresh_variable_global_stats_personal
AFTER INSERT OR UPDATE OR DELETE ON personal.variable_user_stats
FOR EACH STATEMENT EXECUTE FUNCTION global.refresh_variable_global_stats();

CREATE TRIGGER refresh_variable_global_stats_reference
AFTER INSERT OR UPDATE OR DELETE ON reference.variables
FOR EACH STATEMENT EXECUTE FUNCTION global.refresh_variable_global_stats(); 
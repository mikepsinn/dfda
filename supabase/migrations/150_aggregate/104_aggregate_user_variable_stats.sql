-- Aggregate User Variable Statistics View
--
-- Aggregates user variable statistics across all users for each variable,
-- combining with global variable settings
--
CREATE MATERIALIZED VIEW aggregate.aggregate_user_variable_stats AS
WITH user_stats AS (
    SELECT 
        variable_id,
        COUNT(DISTINCT user_id) as number_of_users,
        SUM(number_of_measurements) as total_measurements,
        MIN(minimum_recorded_value) as global_minimum_value,
        MAX(maximum_recorded_value) as global_maximum_value,
        AVG(average_value) as average_value_across_users,
        STDDEV(average_value) as std_dev_between_users,
        AVG(standard_deviation) as avg_std_dev_within_users,
        MIN(earliest_measurement) as earliest_measurement,
        MAX(latest_measurement) as latest_measurement,
        COUNT(DISTINCT unit_id) as number_of_different_units,
        MODE() WITHIN GROUP (ORDER BY unit_id) as most_common_unit_id,
        MODE() WITHIN GROUP (ORDER BY filling_type) as most_common_filling_type,
        MODE() WITHIN GROUP (ORDER BY joining_type) as most_common_joining_type,
        AVG(EXTRACT(EPOCH FROM onset_delay)) as average_onset_delay_seconds,
        AVG(EXTRACT(EPOCH FROM duration_of_action)) as average_duration_seconds
    FROM personal.user_variable_stats
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
    us.number_of_users,
    us.total_measurements,
    us.global_minimum_value,
    us.global_maximum_value,
    us.average_value_across_users,
    us.std_dev_between_users,
    us.avg_std_dev_within_users,
    us.earliest_measurement,
    us.latest_measurement,
    us.number_of_different_units,
    us.most_common_unit_id,
    us.most_common_filling_type,
    us.most_common_joining_type,
    make_interval(secs => us.average_onset_delay_seconds) as inferred_onset_delay,
    make_interval(secs => us.average_duration_seconds) as inferred_duration_of_action,
    NOW() as last_updated
FROM reference.global_variables gv
LEFT JOIN user_stats us ON gv.id = us.variable_id
WHERE gv.deleted_at IS NULL;

-- Create indexes for better query performance
CREATE UNIQUE INDEX idx_aggregate_user_variable_stats_id
ON aggregate.aggregate_user_variable_stats(variable_id);

CREATE INDEX idx_aggregate_user_variable_stats_category
ON aggregate.aggregate_user_variable_stats(category_id);

-- Add comments
COMMENT ON MATERIALIZED VIEW aggregate.aggregate_user_variable_stats IS 
'Aggregated user variable statistics across all users, combined with global settings';

-- Create function to refresh the materialized view
CREATE OR REPLACE FUNCTION aggregate.refresh_aggregate_user_variable_stats()
RETURNS trigger AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY aggregate.aggregate_user_variable_stats;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to refresh when underlying data changes
CREATE TRIGGER refresh_aggregate_user_variable_stats_measurements
AFTER INSERT OR UPDATE OR DELETE ON personal.user_variable_stats
FOR EACH STATEMENT EXECUTE FUNCTION aggregate.refresh_aggregate_user_variable_stats();

CREATE TRIGGER refresh_aggregate_user_variable_stats_variables
AFTER INSERT OR UPDATE OR DELETE ON reference.global_variables
FOR EACH STATEMENT EXECUTE FUNCTION aggregate.refresh_aggregate_user_variable_stats(); 
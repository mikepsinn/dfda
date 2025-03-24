-- Trigger: global.user_variable_stats_refresh_variable_global_stats_measurements
-- Original name: refresh_variable_global_stats_measurements

CREATE TRIGGER refresh_variable_global_stats_measurements
AFTER INSERT OR UPDATE OR DELETE ON personal.user_variable_stats
FOR EACH STATEMENT EXECUTE FUNCTION global.refresh_variable_global_stats();

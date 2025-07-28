-- Trigger: personal.measurements_refresh_user_variable_stats_measurements
-- Original name: refresh_user_variable_stats_measurements

CREATE TRIGGER refresh_user_variable_stats_measurements
AFTER INSERT OR UPDATE OR DELETE ON personal.measurements
FOR EACH STATEMENT EXECUTE FUNCTION personal.refresh_user_variable_stats();

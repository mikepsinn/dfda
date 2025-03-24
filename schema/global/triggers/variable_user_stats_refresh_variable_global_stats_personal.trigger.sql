-- Trigger: global.variable_user_stats_refresh_variable_global_stats_personal
-- Original name: refresh_variable_global_stats_personal

CREATE TRIGGER refresh_variable_global_stats_personal
AFTER INSERT OR UPDATE OR DELETE ON personal.variable_user_stats
FOR EACH STATEMENT EXECUTE FUNCTION global.refresh_variable_global_stats();

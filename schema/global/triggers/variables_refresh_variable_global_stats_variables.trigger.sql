-- Trigger: global.variables_refresh_variable_global_stats_variables
-- Original name: refresh_variable_global_stats_variables

CREATE TRIGGER refresh_variable_global_stats_variables
AFTER INSERT OR UPDATE OR DELETE ON reference.variables
FOR EACH STATEMENT EXECUTE FUNCTION global.refresh_variable_global_stats();

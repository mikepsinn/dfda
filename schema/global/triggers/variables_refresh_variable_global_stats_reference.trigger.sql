-- Trigger: global.variables_refresh_variable_global_stats_reference
-- Original name: refresh_variable_global_stats_reference

CREATE TRIGGER refresh_variable_global_stats_reference
AFTER INSERT OR UPDATE OR DELETE ON reference.variables
FOR EACH STATEMENT EXECUTE FUNCTION global.refresh_variable_global_stats();

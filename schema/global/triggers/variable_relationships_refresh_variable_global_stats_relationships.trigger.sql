-- Trigger: global.variable_relationships_refresh_variable_global_stats_relationships
-- Original name: refresh_variable_global_stats_relationships

CREATE TRIGGER refresh_variable_global_stats_relationships
AFTER INSERT OR UPDATE OR DELETE ON personal.variable_relationships
FOR EACH STATEMENT EXECUTE FUNCTION global.refresh_variable_global_stats();

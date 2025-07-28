-- Trigger: personal.user_variables_refresh_user_variable_stats_variables
-- Original name: refresh_user_variable_stats_variables

CREATE TRIGGER refresh_user_variable_stats_variables
AFTER INSERT OR UPDATE OR DELETE ON personal.user_variables
FOR EACH STATEMENT EXECUTE FUNCTION personal.refresh_user_variable_stats();

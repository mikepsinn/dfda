-- Trigger: global.user_permissions_refresh_variable_global_stats_oauth
-- Original name: refresh_variable_global_stats_oauth

CREATE TRIGGER refresh_variable_global_stats_oauth
AFTER INSERT OR UPDATE OR DELETE ON oauth2.user_permissions
FOR EACH STATEMENT EXECUTE FUNCTION global.refresh_variable_global_stats();

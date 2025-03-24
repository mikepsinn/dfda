-- Function: personal.refresh_user_variable_relationship_stats

CREATE OR REPLACE FUNCTION personal.refresh_user_variable_relationship_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY personal.user_variable_relationship_stats;
END;
$$ LANGUAGE plpgsql;

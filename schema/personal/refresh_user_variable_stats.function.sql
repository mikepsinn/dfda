-- Function: personal.refresh_user_variable_stats

CREATE OR REPLACE FUNCTION personal.refresh_user_variable_stats()
RETURNS trigger AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY personal.user_variable_stats;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

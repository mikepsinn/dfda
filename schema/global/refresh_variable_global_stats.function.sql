-- Function: global.refresh_variable_global_stats

CREATE OR REPLACE FUNCTION global.refresh_variable_global_stats()
RETURNS trigger AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY global.variable_global_stats;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

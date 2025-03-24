-- Function: personal.trigger_refresh_relationship_stats

CREATE OR REPLACE FUNCTION personal.trigger_refresh_relationship_stats()
RETURNS trigger AS $$
BEGIN
    PERFORM personal.refresh_user_variable_relationship_stats();
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

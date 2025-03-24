-- Function: core.jsonb_changed_keys

CREATE OR REPLACE FUNCTION core.jsonb_changed_keys(old_data JSONB, new_data JSONB)
RETURNS TEXT[] AS $$
DECLARE
    changed TEXT[];
    key TEXT;
BEGIN
    changed := ARRAY[]::TEXT[];
    
    -- Check deleted and modified keys
    FOR key IN SELECT * FROM jsonb_object_keys(old_data)
    LOOP
        IF NOT new_data ? key OR new_data->key IS DISTINCT FROM old_data->key THEN
            changed := array_append(changed, key);
        END IF;
    END LOOP;
    
    -- Check new keys
    FOR key IN SELECT * FROM jsonb_object_keys(new_data)
    LOOP
        IF NOT old_data ? key THEN
            changed := array_append(changed, key);
        END IF;
    END LOOP;
    
    RETURN changed;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

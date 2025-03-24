-- Function: core.should_audit_table

CREATE OR REPLACE FUNCTION core.should_audit_table(p_schema TEXT, p_table TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM core.audit_settings 
        WHERE table_schema = p_schema 
        AND table_name = p_table 
        AND is_audited = true
    );
END;
$$ LANGUAGE plpgsql STABLE;

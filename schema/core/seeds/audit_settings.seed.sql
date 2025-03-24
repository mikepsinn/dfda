-- Seed: core.audit_settings
-- Seed data for core.audit_settings

INSERT INTO core.audit_settings (
        table_schema,
        table_name,
        excluded_columns
    ) 
    VALUES (
        p_schema,
        p_table,
        p_excluded_columns
    )
    ON CONFLICT (table_schema, table_name) 
    DO UPDATE SET 
        excluded_columns = p_excluded_columns,
        is_audited = true,
        updated_at = NOW();

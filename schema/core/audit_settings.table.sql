-- Table: core.audit_settings

CREATE TABLE core.audit_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_schema TEXT NOT NULL,
    table_name TEXT NOT NULL,
    is_audited BOOLEAN DEFAULT true,
    excluded_columns TEXT[] DEFAULT '{}',
    track_old_values BOOLEAN DEFAULT true,
    track_new_values BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(table_schema, table_name)
);

-- Table: core.audit_trail

CREATE TABLE core.audit_trail (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_schema TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,  -- Using TEXT to support non-UUID primary keys
    action TEXT NOT NULL CHECK (action IN ('insert', 'update', 'delete')),
    old_values JSONB,
    new_values JSONB,
    changed_columns TEXT[],
    performed_by UUID REFERENCES core.profiles(id) ON DELETE SET NULL,
    client_id UUID REFERENCES oauth2.clients(id) ON DELETE SET NULL,
    source_type TEXT NOT NULL CHECK (source_type IN ('user', 'client', 'system', 'integration', 'migration')),
    ip_address TEXT,
    user_agent TEXT,
    session_id UUID,
    correlation_id TEXT,
    change_reason TEXT,
    app_version TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

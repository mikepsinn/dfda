-- =============================================
-- CORE SCHEMA - Audit System
-- =============================================

-- Audit Settings
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

COMMENT ON TABLE core.audit_settings IS 'Configuration for which tables and columns are audited';

-- Audit Trail
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

-- Indexes for common audit queries
CREATE INDEX idx_audit_trail_record ON core.audit_trail(table_schema, table_name, record_id);
CREATE INDEX idx_audit_trail_performed_by ON core.audit_trail(performed_by);
CREATE INDEX idx_audit_trail_client ON core.audit_trail(client_id);
CREATE INDEX idx_audit_trail_timestamp ON core.audit_trail(created_at DESC);
CREATE INDEX idx_audit_trail_correlation ON core.audit_trail(correlation_id);

COMMENT ON TABLE core.audit_trail IS 'Comprehensive audit trail for tracking all data changes';

-- Function to compare jsonb objects and return changed keys
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

-- Function to check if a table should be audited
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

-- Main audit trigger function
CREATE OR REPLACE FUNCTION core.log_audit()
RETURNS trigger AS $$
DECLARE
    excluded_cols TEXT[];
    old_data JSONB;
    new_data JSONB;
    changed_cols TEXT[];
BEGIN
    -- Check if we should audit this table
    IF NOT core.should_audit_table(TG_TABLE_SCHEMA, TG_TABLE_NAME) THEN
        RETURN NULL;
    END IF;

    -- Get excluded columns
    SELECT COALESCE(excluded_columns, '{}'::TEXT[])
    INTO excluded_cols
    FROM core.audit_settings
    WHERE table_schema = TG_TABLE_SCHEMA
    AND table_name = TG_TABLE_NAME;

    -- Prepare the data, excluding specified columns
    IF TG_OP IN ('UPDATE', 'DELETE') THEN
        old_data := to_jsonb(OLD);
        FOREACH excluded_cols AS excluded_col LOOP
            old_data := old_data - excluded_col;
        END LOOP;
    END IF;

    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        new_data := to_jsonb(NEW);
        FOREACH excluded_cols AS excluded_col LOOP
            new_data := new_data - excluded_col;
        END LOOP;
    END IF;

    -- For updates, only log if there are actual changes
    IF TG_OP = 'UPDATE' THEN
        changed_cols := core.jsonb_changed_keys(old_data, new_data);
        IF changed_cols = '{}'::TEXT[] THEN
            RETURN NULL;
        END IF;
    END IF;

    -- Insert audit record
    INSERT INTO core.audit_trail (
        table_schema,
        table_name,
        record_id,
        action,
        old_values,
        new_values,
        changed_columns,
        performed_by,
        client_id,
        source_type,
        ip_address,
        user_agent,
        session_id,
        correlation_id,
        change_reason,
        app_version
    )
    VALUES (
        TG_TABLE_SCHEMA,
        TG_TABLE_NAME,
        COALESCE(NEW.id::TEXT, OLD.id::TEXT),
        TG_OP,
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN old_data ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN new_data ELSE NULL END,
        changed_cols,
        COALESCE(
            auth.uid(),
            current_setting('app.current_user_id', true)::uuid
        ),
        NULLIF(current_setting('app.current_client_id', true), '')::uuid,
        COALESCE(
            current_setting('app.source_type', true),
            CASE 
                WHEN auth.uid() IS NOT NULL THEN 'user'
                ELSE 'system'
            END
        ),
        current_setting('request.headers', true)::jsonb->>'x-real-ip',
        current_setting('request.headers', true)::jsonb->>'user-agent',
        NULLIF(current_setting('request.jwt.claims', true)::jsonb->>'session_id', '')::uuid,
        current_setting('app.correlation_id', true),
        current_setting('app.change_reason', true),
        current_setting('app.version', true)
    );

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add audit trigger to a table
CREATE OR REPLACE FUNCTION core.enable_audit_for_table(
    p_schema TEXT,
    p_table TEXT,
    p_excluded_columns TEXT[] DEFAULT '{}'::TEXT[]
) RETURNS VOID AS $$
BEGIN
    -- Create or update audit settings
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

    -- Create the trigger if it doesn't exist
    EXECUTE format('
        DROP TRIGGER IF EXISTS audit_trigger ON %I.%I;
        CREATE TRIGGER audit_trigger
        AFTER INSERT OR UPDATE OR DELETE ON %I.%I
        FOR EACH ROW EXECUTE FUNCTION core.log_audit();
    ', p_schema, p_table, p_schema, p_table);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to disable auditing for a table
CREATE OR REPLACE FUNCTION core.disable_audit_for_table(
    p_schema TEXT,
    p_table TEXT
) RETURNS VOID AS $$
BEGIN
    -- Update audit settings
    UPDATE core.audit_settings 
    SET is_audited = false,
        updated_at = NOW()
    WHERE table_schema = p_schema 
    AND table_name = p_table;

    -- Remove the trigger
    EXECUTE format('
        DROP TRIGGER IF EXISTS audit_trigger ON %I.%I;
    ', p_schema, p_table);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE core.audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.audit_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage audit settings"
    ON core.audit_settings
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM core.user_permissions up
            WHERE up.user_id = auth.uid()
            AND up.permission = 'manage_audit_settings'
        )
    );

CREATE POLICY "Users can view their own audit trail"
    ON core.audit_trail
    FOR SELECT
    TO authenticated
    USING (
        performed_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM core.user_permissions up
            WHERE up.user_id = auth.uid()
            AND up.permission = 'view_all_audit_logs'
        )
    );

-- Add initial audit settings for key tables
SELECT core.enable_audit_for_table('personal', 'measurements');
SELECT core.enable_audit_for_table('personal', 'variable_relationships');
SELECT core.enable_audit_for_table('personal', 'user_variables');
SELECT core.enable_audit_for_table('reference', 'variables');
SELECT core.enable_audit_for_table('reference', 'variable_categories');
SELECT core.enable_audit_for_table('reference', 'units_of_measurement');

-- Integration Providers
CREATE TABLE core.integration_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    auth_type TEXT NOT NULL CHECK (auth_type IN ('oauth2', 'api_key', 'basic_auth')),
    oauth_config JSONB,
    api_base_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Integration Connections
CREATE TABLE core.integration_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES core.integration_providers(id) ON DELETE CASCADE,
    auth_provider_id TEXT,
    auth_user_id TEXT,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    connection_status TEXT NOT NULL CHECK (connection_status IN ('connected', 'disconnected', 'expired', 'revoked', 'error')),
    status_message TEXT,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(user_id, provider_id)
);

-- Integration Sync Logs
CREATE TABLE core.integration_sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    connection_id UUID NOT NULL REFERENCES core.integration_connections(id) ON DELETE CASCADE,
    sync_started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    sync_completed_at TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL CHECK (status IN ('in_progress', 'completed', 'failed')),
    data_types TEXT[],
    records_processed INTEGER DEFAULT 0,
    records_created INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
); 
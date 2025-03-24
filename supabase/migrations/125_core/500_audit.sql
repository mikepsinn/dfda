-- =============================================
-- CORE SCHEMA - Audit Trail and Integrations
-- =============================================

-- Audit Trail
CREATE TABLE core.audit_trail (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_schema TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT CHECK (action IN ('insert', 'update', 'delete')),
    old_values JSONB,
    new_values JSONB,
    performed_by UUID REFERENCES core.profiles(id) ON DELETE SET NULL,
    ip_address TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_id UUID,
    correlation_id TEXT,
    change_reason TEXT,
    field_changes JSONB
);

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
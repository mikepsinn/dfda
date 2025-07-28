-- Table: core.integration_connections

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

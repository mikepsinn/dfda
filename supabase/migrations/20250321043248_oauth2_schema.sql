-- =============================================
-- OAUTH2 SCHEMA - OAuth2 Authorization Server
-- =============================================

-- OAuth2 Clients
CREATE TABLE oauth2.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id TEXT NOT NULL UNIQUE,
    client_secret TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    homepage_url TEXT,
    logo_url TEXT,
    redirect_uris TEXT[] NOT NULL,
    grant_types TEXT[] NOT NULL,
    response_types TEXT[] NOT NULL,
    scope TEXT,
    owner_id UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    is_confidential BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- OAuth2 Access Tokens
CREATE TABLE oauth2.access_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token TEXT NOT NULL UNIQUE,
    client_id UUID NOT NULL REFERENCES oauth2.clients(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    scope TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- OAuth2 Refresh Tokens
CREATE TABLE oauth2.refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token TEXT NOT NULL UNIQUE,
    access_token_id UUID NOT NULL REFERENCES oauth2.access_tokens(id) ON DELETE CASCADE,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- OAuth2 Authorization Codes
CREATE TABLE oauth2.authorization_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL UNIQUE,
    client_id UUID NOT NULL REFERENCES oauth2.clients(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    redirect_uri TEXT NOT NULL,
    scope TEXT,
    code_challenge TEXT,
    code_challenge_method TEXT CHECK (code_challenge_method IN ('plain', 'S256')),
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- OAuth2 User Consents
CREATE TABLE oauth2.user_consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES oauth2.clients(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    scope TEXT NOT NULL,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(client_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE oauth2.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth2.access_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth2.refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth2.authorization_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth2.user_consents ENABLE ROW LEVEL SECURITY;

-- Create policies
-- OAuth2 Clients
CREATE POLICY "Users can view their own OAuth2 clients"
    ON oauth2.clients FOR SELECT
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can manage their own OAuth2 clients"
    ON oauth2.clients FOR ALL
    USING (auth.uid() = owner_id);

CREATE POLICY "Staff can view all OAuth2 clients"
    ON oauth2.clients FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'view_oauth2'
    ));

CREATE POLICY "Staff can manage OAuth2 clients"
    ON oauth2.clients FOR ALL
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'manage_oauth2'
    ));

-- OAuth2 Access Tokens
CREATE POLICY "Users can view their own access tokens"
    ON oauth2.access_tokens FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Staff can view all access tokens"
    ON oauth2.access_tokens FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'view_oauth2'
    ));

-- OAuth2 Refresh Tokens
CREATE POLICY "Users can view their own refresh tokens"
    ON oauth2.refresh_tokens FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM oauth2.access_tokens at
        WHERE at.id = access_token_id
        AND at.user_id = auth.uid()
    ));

CREATE POLICY "Staff can view all refresh tokens"
    ON oauth2.refresh_tokens FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'view_oauth2'
    ));

-- OAuth2 Authorization Codes
CREATE POLICY "Users can view their own authorization codes"
    ON oauth2.authorization_codes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Staff can view all authorization codes"
    ON oauth2.authorization_codes FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'view_oauth2'
    ));

-- OAuth2 User Consents
CREATE POLICY "Users can view their own consents"
    ON oauth2.user_consents FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own consents"
    ON oauth2.user_consents FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Staff can view all consents"
    ON oauth2.user_consents FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'view_oauth2'
    ));

CREATE POLICY "Staff can manage all consents"
    ON oauth2.user_consents FOR ALL
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'manage_oauth2'
    )); 
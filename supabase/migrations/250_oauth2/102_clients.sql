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

-- Enable Row Level Security
ALTER TABLE oauth2.clients ENABLE ROW LEVEL SECURITY;

-- Create policies
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
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
ALTER TABLE oauth2.user_consents ENABLE ROW LEVEL SECURITY;

-- Create policies
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
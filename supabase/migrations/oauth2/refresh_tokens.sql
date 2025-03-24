-- OAuth2 Refresh Tokens
CREATE TABLE oauth2.refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token TEXT NOT NULL UNIQUE,
    access_token_id UUID NOT NULL REFERENCES oauth2.access_tokens(id) ON DELETE CASCADE,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE oauth2.refresh_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies
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
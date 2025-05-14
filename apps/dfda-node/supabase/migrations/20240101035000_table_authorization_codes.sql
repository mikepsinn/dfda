CREATE TABLE public.authorization_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    client_id TEXT NOT NULL, -- Will add FK constraint in a separate step if not already present on oauth_clients.client_id
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    redirect_uri TEXT NOT NULL,
    scope TEXT, -- Store the granted scopes
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
    -- Optional: PKCE parameters if we decide to support it later
    -- code_challenge TEXT,
    -- code_challenge_method TEXT -- e.g., 'S256'
);

-- Ensure oauth_clients table and its client_id column exist before adding FK.
-- If oauth_clients.client_id is not yet a primary or unique key, that needs to be addressed first.
-- Assuming oauth_clients.client_id is suitable as a foreign key target:
ALTER TABLE public.authorization_codes
ADD CONSTRAINT fk_authorization_codes_client_id
FOREIGN KEY (client_id) REFERENCES public.oauth_clients(client_id) ON DELETE CASCADE; 
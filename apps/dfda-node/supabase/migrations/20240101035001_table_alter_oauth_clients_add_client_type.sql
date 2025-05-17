ALTER TABLE public.oauth_clients
ADD COLUMN client_type public.oauth_client_type_enum NOT NULL DEFAULT 'confidential';

COMMENT ON COLUMN public.oauth_clients.client_type IS 'Type of client: public or confidential. Determines if a client secret is required for token exchange or if PKCE is used.';

-- The CHECK constraint is no longer needed as the ENUM type enforces the allowed values.
-- ALTER TABLE public.oauth_clients
-- ADD CONSTRAINT check_client_type CHECK (client_type IN ('public', 'confidential')); 
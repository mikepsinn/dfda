ALTER TABLE public.oauth_authorization_codes
ADD COLUMN code_challenge TEXT,
ADD COLUMN code_challenge_method TEXT;

COMMENT ON COLUMN public.oauth_authorization_codes.code_challenge IS 'PKCE code challenge.';
COMMENT ON COLUMN public.oauth_authorization_codes.code_challenge_method IS 'PKCE code challenge method (e.g., S256, plain).';

-- You might want to add a CHECK constraint for code_challenge_method if it's always S256 or plain
ALTER TABLE public.oauth_authorization_codes
ADD CONSTRAINT check_code_challenge_method CHECK (code_challenge_method IN ('S256', 'plain')); 
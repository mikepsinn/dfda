-- Indexes for performance on authorization_codes table
CREATE INDEX idx_authorization_codes_code ON public.oauth_authorization_codes(code);
CREATE INDEX idx_authorization_codes_expires_at ON public.oauth_authorization_codes(expires_at); 
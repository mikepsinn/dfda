CREATE TYPE public.oauth_client_type_enum AS ENUM (
    'public',
    'confidential'
);

COMMENT ON TYPE public.oauth_client_type_enum IS 'Enum for OAuth client types: public or confidential.'; 
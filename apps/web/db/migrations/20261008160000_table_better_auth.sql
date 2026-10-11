-- Sign-in moves from Supabase Auth to Better Auth (lib/auth.ts).
--
-- 1. The custom OAuth server tables are replaced by the tables of the Better
--    Auth OAuth provider plugin. They held no real clients or tokens.
-- 2. Better Auth tables: users, sessions, accounts and verifications; the
--    organization plugin (organizations, organization_members,
--    organization_invitations); the JWT plugin (jwks) and the OAuth provider
--    plugin (oauth_*). Better Auth generated these statements for the options
--    in lib/auth.ts (`getMigrations` from better-auth/db/migration). Column
--    names are Better Auth's own (camelCase). If you change those options,
--    generate the changes again and add them as a new migration.
-- 3. These tables hold password hashes, session tokens and signing keys. Only
--    the server (the DATABASE_URL owner) reads them. Row-level security is on
--    with no policies, and the anon and authenticated roles have no access.
-- 4. A user id is also the profile id (profiles.id). Better Auth creates the
--    profile when it creates the user (databaseHooks in lib/auth.ts). Deleting
--    a user deletes the profile, as deleting a Supabase auth user did.

DROP TABLE IF EXISTS public.oauth_refresh_tokens;
DROP TABLE IF EXISTS public.oauth_access_tokens;
DROP TABLE IF EXISTS public.oauth_authorization_codes;
DROP TABLE IF EXISTS public.oauth_clients;
DROP TYPE IF EXISTS public.oauth_client_type_enum;

CREATE TABLE public."users" ("id" uuid default pg_catalog.gen_random_uuid() not null primary key, "name" text not null, "email" text not null unique, "emailVerified" boolean not null, "image" text, "createdAt" timestamptz default CURRENT_TIMESTAMP not null, "updatedAt" timestamptz default CURRENT_TIMESTAMP not null);

CREATE TABLE public."sessions" ("id" uuid default pg_catalog.gen_random_uuid() not null primary key, "expiresAt" timestamptz not null, "token" text not null unique, "createdAt" timestamptz default CURRENT_TIMESTAMP not null, "updatedAt" timestamptz not null, "ipAddress" text, "userAgent" text, "userId" uuid not null references public."users" ("id") on delete cascade, "activeOrganizationId" text);

CREATE TABLE public."accounts" ("id" uuid default pg_catalog.gen_random_uuid() not null primary key, "accountId" text not null, "providerId" text not null, "userId" uuid not null references public."users" ("id") on delete cascade, "accessToken" text, "refreshToken" text, "idToken" text, "accessTokenExpiresAt" timestamptz, "refreshTokenExpiresAt" timestamptz, "scope" text, "password" text, "createdAt" timestamptz default CURRENT_TIMESTAMP not null, "updatedAt" timestamptz not null);

-- The id is text: Better Auth also writes SHA-256 digests here (lock rows when a
-- magic link verifies an existing, unverified user).
CREATE TABLE public."verifications" ("id" text default pg_catalog.gen_random_uuid()::text not null primary key, "identifier" text not null, "value" text not null, "expiresAt" timestamptz not null, "createdAt" timestamptz default CURRENT_TIMESTAMP not null, "updatedAt" timestamptz default CURRENT_TIMESTAMP not null);

CREATE TABLE public."organizations" ("id" uuid default pg_catalog.gen_random_uuid() not null primary key, "name" text not null, "slug" text not null unique, "logo" text, "createdAt" timestamptz not null, "metadata" text);

CREATE TABLE public."organization_members" ("id" uuid default pg_catalog.gen_random_uuid() not null primary key, "organizationId" uuid not null references public."organizations" ("id") on delete cascade, "userId" uuid not null references public."users" ("id") on delete cascade, "role" text not null, "createdAt" timestamptz not null);

CREATE TABLE public."organization_invitations" ("id" uuid default pg_catalog.gen_random_uuid() not null primary key, "organizationId" uuid not null references public."organizations" ("id") on delete cascade, "email" text not null, "role" text, "status" text not null, "expiresAt" timestamptz not null, "createdAt" timestamptz default CURRENT_TIMESTAMP not null, "inviterId" uuid not null references public."users" ("id") on delete cascade);

CREATE TABLE public."jwks" ("id" uuid default pg_catalog.gen_random_uuid() not null primary key, "publicKey" text not null, "privateKey" text not null, "createdAt" timestamptz not null, "expiresAt" timestamptz, "alg" text, "crv" text);

CREATE TABLE public."oauth_clients" ("id" uuid default pg_catalog.gen_random_uuid() not null primary key, "clientId" text not null unique, "clientSecret" text, "clientDiscoveryId" text, "disabled" boolean, "skipConsent" boolean, "enableEndSession" boolean, "subjectType" text, "scopes" jsonb, "clientCredentialsScopes" jsonb, "userId" uuid references public."users" ("id") on delete cascade, "createdAt" timestamptz, "updatedAt" timestamptz, "name" text, "uri" text, "icon" text, "contacts" jsonb, "tos" text, "policy" text, "softwareId" text, "softwareVersion" text, "softwareStatement" text, "redirectUris" jsonb not null, "postLogoutRedirectUris" jsonb, "backchannelLogoutUri" text, "backchannelLogoutSessionRequired" boolean, "tokenEndpointAuthMethod" text, "applicationType" text, "jwks" text, "jwksUri" text, "grantTypes" jsonb, "responseTypes" jsonb, "requirePKCE" boolean, "dpopBoundAccessTokens" boolean, "referenceId" text, "metadata" jsonb);

CREATE TABLE public."oauth_resources" ("id" uuid default pg_catalog.gen_random_uuid() not null primary key, "identifier" text not null unique, "name" text not null, "accessTokenTtl" integer, "refreshTokenTtl" integer, "signingAlgorithm" text, "signingKeyId" text, "allowedScopes" jsonb, "customClaims" jsonb, "dpopBoundAccessTokensRequired" boolean, "disabled" boolean, "createdAt" timestamptz, "updatedAt" timestamptz, "policyVersion" integer, "metadata" jsonb);

CREATE TABLE public."oauth_client_resources" ("id" uuid default pg_catalog.gen_random_uuid() not null primary key, "clientId" text not null references public."oauth_clients" ("clientId") on delete cascade, "resourceId" text not null references public."oauth_resources" ("identifier") on delete cascade, "metadata" jsonb, "createdAt" timestamptz);

CREATE TABLE public."oauth_refresh_tokens" ("id" uuid default pg_catalog.gen_random_uuid() not null primary key, "token" text not null unique, "clientId" text not null references public."oauth_clients" ("clientId") on delete cascade, "sessionId" uuid references public."sessions" ("id") on delete set null, "userId" uuid not null references public."users" ("id") on delete cascade, "referenceId" text, "authorizationCodeId" text, "resources" jsonb, "requestedUserInfoClaims" jsonb, "expiresAt" timestamptz not null, "createdAt" timestamptz not null, "revoked" timestamptz, "rotatedAt" timestamptz, "rotationReplayResponse" text, "rotationReplayExpiresAt" timestamptz, "authTime" timestamptz, "confirmation" jsonb, "scopes" jsonb not null);

CREATE TABLE public."oauth_access_tokens" ("id" uuid default pg_catalog.gen_random_uuid() not null primary key, "token" text not null unique, "clientId" text not null references public."oauth_clients" ("clientId") on delete cascade, "sessionId" uuid references public."sessions" ("id") on delete set null, "userId" uuid references public."users" ("id") on delete cascade, "referenceId" text, "authorizationCodeId" text, "resources" jsonb, "requestedUserInfoClaims" jsonb, "refreshId" uuid references public."oauth_refresh_tokens" ("id") on delete cascade, "expiresAt" timestamptz not null, "createdAt" timestamptz not null, "revoked" timestamptz, "confirmation" jsonb, "scopes" jsonb not null);

CREATE TABLE public."oauth_consents" ("id" uuid default pg_catalog.gen_random_uuid() not null primary key, "clientId" text not null references public."oauth_clients" ("clientId") on delete cascade, "userId" uuid references public."users" ("id") on delete cascade, "referenceId" text, "resources" jsonb, "requestedUserInfoClaims" jsonb, "scopes" jsonb not null, "createdAt" timestamptz not null, "updatedAt" timestamptz not null);

-- The id is a SHA-256 digest of the client assertion (replay protection), not a UUID.
CREATE TABLE public."oauth_client_assertions" ("id" text not null primary key, "expiresAt" timestamptz not null);

CREATE INDEX "sessions_userId_idx" on public."sessions" ("userId");

CREATE INDEX "accounts_userId_idx" on public."accounts" ("userId");

CREATE INDEX "verifications_identifier_idx" on public."verifications" ("identifier");

CREATE INDEX "organization_members_organizationId_idx" on public."organization_members" ("organizationId");

CREATE INDEX "organization_members_userId_idx" on public."organization_members" ("userId");

CREATE INDEX "organization_invitations_organizationId_idx" on public."organization_invitations" ("organizationId");

CREATE INDEX "organization_invitations_email_idx" on public."organization_invitations" ("email");

CREATE INDEX "oauth_clients_userId_idx" on public."oauth_clients" ("userId");

CREATE INDEX "oauth_client_resources_clientId_idx" on public."oauth_client_resources" ("clientId");

CREATE INDEX "oauth_client_resources_resourceId_idx" on public."oauth_client_resources" ("resourceId");

CREATE INDEX "oauth_refresh_tokens_clientId_idx" on public."oauth_refresh_tokens" ("clientId");

CREATE INDEX "oauth_refresh_tokens_sessionId_idx" on public."oauth_refresh_tokens" ("sessionId");

CREATE INDEX "oauth_refresh_tokens_userId_idx" on public."oauth_refresh_tokens" ("userId");

CREATE INDEX "oauth_refresh_tokens_authorizationCodeId_idx" on public."oauth_refresh_tokens" ("authorizationCodeId");

CREATE INDEX "oauth_access_tokens_clientId_idx" on public."oauth_access_tokens" ("clientId");

CREATE INDEX "oauth_access_tokens_sessionId_idx" on public."oauth_access_tokens" ("sessionId");

CREATE INDEX "oauth_access_tokens_userId_idx" on public."oauth_access_tokens" ("userId");

CREATE INDEX "oauth_access_tokens_authorizationCodeId_idx" on public."oauth_access_tokens" ("authorizationCodeId");

CREATE INDEX "oauth_access_tokens_refreshId_idx" on public."oauth_access_tokens" ("refreshId");

CREATE INDEX "oauth_consents_clientId_idx" on public."oauth_consents" ("clientId");

CREATE INDEX "oauth_consents_userId_idx" on public."oauth_consents" ("userId");

CREATE UNIQUE INDEX "oauth_client_resources_clientId_resourceId_uidx" on public."oauth_client_resources" ("clientId", "resourceId");

ALTER TABLE public."users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."verifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."organizations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."organization_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."organization_invitations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."jwks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."oauth_clients" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."oauth_resources" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."oauth_client_resources" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."oauth_refresh_tokens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."oauth_access_tokens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."oauth_consents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."oauth_client_assertions" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON
  public."users",
  public."sessions",
  public."accounts",
  public."verifications",
  public."organizations",
  public."organization_members",
  public."organization_invitations",
  public."jwks",
  public."oauth_clients",
  public."oauth_resources",
  public."oauth_client_resources",
  public."oauth_refresh_tokens",
  public."oauth_access_tokens",
  public."oauth_consents",
  public."oauth_client_assertions"
  FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.handle_deleted_app_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  DELETE FROM public.profiles WHERE id = OLD.id;
  RETURN OLD;
END;
$$;

CREATE TRIGGER on_app_user_deleted
  AFTER DELETE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_deleted_app_user();

REVOKE EXECUTE ON FUNCTION public.handle_deleted_app_user() FROM PUBLIC, anon, authenticated;

import { betterAuth, type BetterAuthPlugin } from 'better-auth'
import { nextCookies } from 'better-auth/next-js'
import { jwt, magicLink, organization } from 'better-auth/plugins'
import { DEFAULT_OAUTH_SCOPES, oauthProvider } from '@better-auth/oauth-provider'
import { Pool } from 'pg'
import { adminDb } from '@/lib/db'
import { env } from '@/lib/env'
import { linkEmail, sendEmail } from '@/lib/email'
import { authEmailContext, linkOnHost } from '@/lib/instance/auth-email'
import { findInstanceByHost, requestOrigin } from '@/lib/instance/hosts'
import { logger } from '@/lib/logger'
import { apiResources, resourceUrl, trackingScopes, type ApiResource } from '@/lib/oauth-resources'
import { getBaseUrl } from '@/lib/url'

/**
 * Sign-in for the app (Better Auth). Users, sessions, OAuth clients and
 * organizations are tables in the app database (see the migration
 * 20261008160000_table_better_auth.sql). Pages and actions read the current
 * user with getServerUser() from '@/lib/server-auth'.
 *
 * Sign-in methods:
 * - magic link by email (also creates the account),
 * - Google, when GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set,
 * - email and password, for accounts that already exist. A password is set
 *   with the password reset email. Open sign-up with a password is off, so
 *   that nobody can create an account for an email address they do not own.
 *
 * The app is also an OAuth 2.1 / OpenID Connect provider for third-party apps
 * and MCP clients: authorization at /api/auth/oauth2/authorize, tokens at
 * /api/auth/oauth2/token, dynamic client registration at
 * /api/auth/oauth2/register, metadata at
 * /.well-known/oauth-authorization-server/api/auth.
 *
 * Third-party apps use it for the MCP server (/api/mcp) and the REST API
 * (/api/v1): with the `resource` parameter set to one of them, the token is a
 * JWT for that API (see lib/oauth-resources.ts and lib/api/access-token.ts).
 */

const siteUrl = getBaseUrl().replace(/\/$/, '')

// Vercel preview deployments serve the app from their own host name.
const trustedOrigins = [siteUrl]
if (process.env.VERCEL_URL) trustedOrigins.push(`https://${process.env.VERCEL_URL}`)
if (process.env.NODE_ENV !== 'production') trustedOrigins.push('http://localhost:3000', 'http://127.0.0.1:3000')

/**
 * The trusted origins for one request: the site's own, plus a company
 * instance's domain or subdomain (lib/instance) when the request arrives on
 * it, so that people can sign in there. A request to another host never
 * trusts an instance domain, so instance domains cannot be used as redirect
 * targets from the main site.
 */
export async function trustedOriginsFor(request?: Request): Promise<string[]> {
  if (!request) return trustedOrigins
  const { host, origin } = requestOrigin(request)
  try {
    if (host && (await findInstanceByHost(host))) return [...trustedOrigins, origin]
  } catch (error) {
    logger.error('Could not check whether the request host is an instance', {
      host,
      error: error instanceof Error ? error.message : String(error),
    })
  }
  return trustedOrigins
}

const googleSignIn =
  env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
    ? { google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET } }
    : undefined

/** True when the Google sign-in button can be shown. */
export const isGoogleSignInEnabled = Boolean(googleSignIn)

// The OAuth 2.1 / OpenID Connect provider. The cast works around a type
// mismatch in @better-auth/oauth-provider 1.7.7 (its init() returns a session
// hook that requires userId, where Better Auth's plugin type has it optional).
// Runtime behavior is not affected, and the cast keeps the types of the
// plugin's endpoints (auth.api.createOAuthClient and others).
const oauthProviderPluginUncast = oauthProvider({
  loginPage: '/login',
  consentPage: '/oauth/consent',
  // MCP clients register themselves (RFC 7591). They are public clients
  // that use PKCE, and each user still approves each client on the
  // consent page.
  allowDynamicClientRegistration: true,
  allowUnauthenticatedClientRegistration: true,
  scopes: [...DEFAULT_OAUTH_SCOPES, ...trackingScopes],
  // The APIs that accept these tokens. Better Auth stores them in
  // oauth_resources on first use; 'merge' keeps those rows in step with this
  // list. Any client may ask for a token for them; the person still approves
  // each client and its scopes on the consent page.
  resources: (Object.keys(apiResources) as ApiResource[]).map((resource) => ({
    identifier: resourceUrl(resource),
    name: apiResources[resource].name,
    allowedScopes: [...trackingScopes, 'offline_access'],
  })),
  resourceSeedMode: 'merge',
  enforcePerClientResources: false,
  schema: {
    oauthClient: { modelName: 'oauth_clients' },
    oauthRefreshToken: { modelName: 'oauth_refresh_tokens' },
    oauthAccessToken: { modelName: 'oauth_access_tokens' },
    oauthConsent: { modelName: 'oauth_consents' },
    oauthResource: { modelName: 'oauth_resources' },
    oauthClientResource: { modelName: 'oauth_client_resources' },
    oauthClientAssertion: { modelName: 'oauth_client_assertions' },
  },
})
const oauthProviderPlugin = oauthProviderPluginUncast as Omit<typeof oauthProviderPluginUncast, 'init'> &
  Pick<BetterAuthPlugin, 'init'>

export const auth = betterAuth({
  appName: env.NEXT_PUBLIC_SITE_NAME,
  baseURL: siteUrl,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: trustedOriginsFor,
  // A pool of its own; Prisma (lib/db) keeps a separate one. Creating the pool
  // does not connect, so the build needs no database.
  database: new Pool({ connectionString: env.DATABASE_URL }),
  advanced: {
    // User ids are UUIDs, because profiles.id and the row-level security
    // policies (auth.uid()) use the uuid type.
    database: { generateId: 'uuid' },
  },
  // Table names follow the app's plural, snake_case style. Column names are
  // Better Auth's own (camelCase).
  user: { modelName: 'users' },
  session: { modelName: 'sessions' },
  account: {
    modelName: 'accounts',
    accountLinking: { enabled: true, trustedProviders: ['google'] },
  },
  verification: { modelName: 'verifications' },
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 8,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }, request) => {
      const company = await authEmailContext(request)
      await sendEmail(
        linkEmail(
          user.email,
          company ? `Reset your ${company.brand.name} password` : 'Reset your password',
          'Use this link to set a new password.',
          'Set a new password',
          company?.origin ? linkOnHost(url, company.origin) : url,
          company?.brand,
        ),
      )
    },
  },
  socialProviders: googleSignIn,
  // Every new user gets a profile row (id and email), as the Supabase
  // on_auth_user_created trigger did. Choosing a role later creates the
  // patient, provider or research partner row.
  databaseHooks: {
    user: {
      create: {
        // A person who used the app with Supabase sign-in already has a
        // profile (and maybe patient or provider data) under their old user
        // id. When they sign in for the first time with a proven email
        // address, the new user takes that id, so their data stays theirs.
        before: async (user) => {
          if (!user.emailVerified) return
          const profile = await adminDb.profiles.findUnique({ where: { email: user.email }, select: { id: true } })
          if (!profile) return
          const owner = await adminDb.users.findUnique({ where: { id: profile.id }, select: { id: true } })
          if (owner) return
          logger.info('New user takes the id of an existing profile', { userId: profile.id })
          return { data: { ...user, id: profile.id } }
        },
        after: async (user) => {
          await adminDb.profiles.upsert({
            where: { id: user.id },
            create: { id: user.id, email: user.email },
            update: {},
            select: { id: true },
          })
          logger.info('Created the profile for a new user', { userId: user.id })
        },
      },
    },
  },
  disabledPaths: [
    // The OAuth provider issues tokens at /oauth2/token.
    '/token',
  ],
  plugins: [
    magicLink({
      // On a company's site the email comes from the company, and its link signs the person in on that site.
      sendMagicLink: async ({ email, url }, ctx) => {
        const company = await authEmailContext(ctx?.request)
        await sendEmail(
          linkEmail(
            email,
            company ? `Sign in to ${company.brand.name}` : 'Your sign-in link',
            'Use this link to sign in.',
            'Sign in',
            company?.origin ? linkOnHost(url, company.origin) : url,
            company?.brand,
          ),
        )
      },
    }),
    organization({
      schema: {
        organization: { modelName: 'organizations' },
        member: { modelName: 'organization_members' },
        invitation: { modelName: 'organization_invitations' },
      },
    }),
    jwt({ schema: { jwks: { modelName: 'jwks' } } }),
    oauthProviderPlugin,
    // Must be last: lets server actions set the session cookie.
    nextCookies(),
  ],
})

export type AuthSession = typeof auth.$Infer.Session
export type AuthUser = AuthSession['user']

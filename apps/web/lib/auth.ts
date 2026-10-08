import { betterAuth, type BetterAuthPlugin } from 'better-auth'
import { nextCookies } from 'better-auth/next-js'
import { jwt, magicLink, organization } from 'better-auth/plugins'
import { oauthProvider } from '@better-auth/oauth-provider'
import { Pool } from 'pg'
import { adminDb } from '@/lib/db'
import { env } from '@/lib/env'
import { linkEmail, sendEmail } from '@/lib/email'
import { logger } from '@/lib/logger'
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
 */

const siteUrl = getBaseUrl().replace(/\/$/, '')

// Vercel preview deployments serve the app from their own host name.
const trustedOrigins = [siteUrl]
if (process.env.VERCEL_URL) trustedOrigins.push(`https://${process.env.VERCEL_URL}`)
if (process.env.NODE_ENV !== 'production') trustedOrigins.push('http://localhost:3000', 'http://127.0.0.1:3000')

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
  trustedOrigins,
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
    sendResetPassword: async ({ user, url }) => {
      await sendEmail(
        linkEmail(user.email, 'Reset your password', 'Use this link to set a new password.', 'Set a new password', url),
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
      sendMagicLink: async ({ email, url }) => {
        await sendEmail(linkEmail(email, 'Your sign-in link', 'Use this link to sign in.', 'Sign in', url))
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

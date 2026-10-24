import { createHash, randomBytes } from 'node:crypto'
import * as authRoute from '@/app/api/auth/[...all]/route'
import { ensurePasswordUser } from '@/lib/auth-users'

// Runs the OAuth 2.1 authorization code flow against the app's auth route
// (Better Auth's handler), as an MCP client does: dynamic client
// registration, PKCE, consent and the token request with a `resource`
// parameter. `origin` is the main site, or a company's own address.

export const siteOrigin = 'http://localhost:3000'
const redirectUri = 'https://client.example.com/callback'

function call(path: string, init: RequestInit & { cookie?: string; origin?: string } = {}) {
  const { cookie, origin = siteOrigin, ...rest } = init
  const headers = new Headers(rest.headers)
  if (cookie) headers.set('cookie', cookie)
  headers.set('origin', origin)
  const request = new Request(`${origin}/api/auth${path}`, { ...rest, headers })
  return rest.method === 'POST' ? authRoute.POST(request) : authRoute.GET(request)
}

async function json(response: Response) {
  const body = await response.json().catch(() => null)
  if (!response.ok) throw new Error(`${response.status}: ${JSON.stringify(body)}`)
  return body
}

/** Creates a user with a password and returns its id and a session cookie of `origin`. */
export async function signedInUser(email: string, origin = siteOrigin) {
  const password = 'correct horse battery staple'
  const userId = await ensurePasswordUser(email, 'Test User', password)
  const response = await call('/sign-in/email', {
    origin,
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  await json(response.clone())
  const cookie = response.headers.get('set-cookie')!.split(';')[0]
  return { userId, cookie }
}

/** Registers a public client, as an MCP client does on first use. */
export async function registerClient(origin = siteOrigin) {
  const client = await json(
    await call('/oauth2/register', {
      origin,
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        client_name: 'Test MCP client',
        redirect_uris: [redirectUri],
        token_endpoint_auth_method: 'none',
        grant_types: ['authorization_code', 'refresh_token'],
        response_types: ['code'],
      }),
    }),
  )
  return client.client_id as string
}

/**
 * Runs authorize, consent and token on `origin`; returns the token response,
 * and the `iss` parameter of the authorization response.
 */
export async function getAccessToken(options: {
  cookie: string
  clientId: string
  resource: string
  scope: string
  origin?: string
}) {
  const origin = options.origin ?? siteOrigin
  const verifier = randomBytes(32).toString('base64url')
  const challenge = createHash('sha256').update(verifier).digest('base64url')
  const query = new URLSearchParams({
    response_type: 'code',
    client_id: options.clientId,
    redirect_uri: redirectUri,
    scope: options.scope,
    state: 'test-state',
    code_challenge: challenge,
    code_challenge_method: 'S256',
    resource: options.resource,
  })

  // The authorization endpoint sends a signed-in user to the consent page.
  const authorize = await call(`/oauth2/authorize?${query}`, { origin, cookie: options.cookie, redirect: 'manual' })
  const consentUrl = new URL(authorize.headers.get('location') ?? (await authorize.json()).url, origin)
  if (consentUrl.pathname !== '/oauth/consent') {
    throw new Error(`Expected the consent page, got ${consentUrl}`)
  }

  const consent = await json(
    await call('/oauth2/consent', {
      origin,
      method: 'POST',
      cookie: options.cookie,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ accept: true, scope: options.scope, oauth_query: consentUrl.search.slice(1) }),
    }),
  )
  const callback = new URL(consent.url ?? consent.redirect_uri)
  const code = callback.searchParams.get('code')
  if (!code) throw new Error(`No code in ${callback}`)

  // OAuth clients send the token request form-encoded.
  const token = (await json(
    await call('/oauth2/token', {
      origin,
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: options.clientId,
        code_verifier: verifier,
        resource: options.resource,
      }),
    }),
  )) as { access_token: string; token_type: string; scope?: string; refresh_token?: string }
  return { ...token, iss: callback.searchParams.get('iss') }
}

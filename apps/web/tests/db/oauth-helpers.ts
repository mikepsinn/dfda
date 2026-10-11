import { createHash, randomBytes } from 'node:crypto'
import { auth } from '@/lib/auth'
import { ensurePasswordUser } from '@/lib/auth-users'

// Runs the OAuth 2.1 authorization code flow against Better Auth's handler, as
// an MCP client does: dynamic client registration, PKCE, consent and the token
// request with a `resource` parameter.

const origin = 'http://localhost:3000'
const redirectUri = 'https://client.example.com/callback'

function call(path: string, init: RequestInit & { cookie?: string } = {}) {
  const headers = new Headers(init.headers)
  if (init.cookie) headers.set('cookie', init.cookie)
  headers.set('origin', origin)
  return auth.handler(new Request(`${origin}/api/auth${path}`, { ...init, headers }))
}

async function json(response: Response) {
  const body = await response.json().catch(() => null)
  if (!response.ok) throw new Error(`${response.status}: ${JSON.stringify(body)}`)
  return body
}

/** Creates a user with a password and returns its id and a session cookie. */
export async function signedInUser(email: string) {
  const password = 'correct horse battery staple'
  const userId = await ensurePasswordUser(email, 'Test User', password)
  const response = await call('/sign-in/email', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  await json(response.clone())
  const cookie = response.headers.get('set-cookie')!.split(';')[0]
  return { userId, cookie }
}

/** Registers a public client, as an MCP client does on first use. */
export async function registerClient() {
  const client = await json(
    await call('/oauth2/register', {
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

/** Runs authorize, consent and token; returns the token response. */
export async function getAccessToken(options: {
  cookie: string
  clientId: string
  resource: string
  scope: string
}) {
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
  const authorize = await call(`/oauth2/authorize?${query}`, { cookie: options.cookie, redirect: 'manual' })
  const consentUrl = new URL(authorize.headers.get('location') ?? (await authorize.json()).url, origin)
  if (consentUrl.pathname !== '/oauth/consent') {
    throw new Error(`Expected the consent page, got ${consentUrl}`)
  }

  const consent = await json(
    await call('/oauth2/consent', {
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
  return json(
    await call('/oauth2/token', {
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
  ) as Promise<{ access_token: string; token_type: string; scope?: string; refresh_token?: string }>
}

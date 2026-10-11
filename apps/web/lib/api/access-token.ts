import { createLocalJWKSet, decodeProtectedHeader, jwtVerify, type JSONWebKeySet, type JWK } from 'jose'
import { adminDb } from '@/lib/db'
import { tokenIssuer } from '@/lib/oauth-resources'

/**
 * Verifies the access tokens that this app's OAuth server (lib/auth.ts) issues
 * for its own APIs. With a `resource` parameter, Better Auth issues a JWT
 * signed with a key from the jwks table; this module checks it locally with
 * the same checks as Better Auth's token introspection: signature, issuer,
 * audience, expiry, an enabled client and a live sign-in session. It also
 * checks that the user still exists.
 *
 * Tokens issued without a `resource` parameter are opaque and are refused:
 * they are meant for the OpenID Connect user info endpoint only.
 */

export type VerifiedAccessToken = {
  userId: string
  clientId: string
  scopes: string[]
}

export class AccessTokenError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AccessTokenError'
  }
}

const KEY_CACHE_MS = 5 * 60 * 1000
let keyCache: { keySet: ReturnType<typeof createLocalJWKSet>; kids: Set<string>; loadedAt: number } | null = null

async function loadKeys() {
  const rows = await adminDb.jwks.findMany({ select: { id: true, publicKey: true, alg: true, expiresAt: true } })
  const now = new Date()
  const keys: JWK[] = rows
    .filter((row) => !row.expiresAt || row.expiresAt > now)
    // Better Auth stores the public JWK without its id, and signs with the row id as `kid`.
    .map((row) => ({ ...(JSON.parse(row.publicKey) as JWK), kid: row.id, alg: row.alg ?? 'EdDSA' }))
  const keySet: JSONWebKeySet = { keys }
  keyCache = { keySet: createLocalJWKSet(keySet), kids: new Set(keys.map((key) => key.kid!)), loadedAt: Date.now() }
  return keyCache
}

/** The signing keys, reloaded when they are old or when a token names a key that is not cached. */
async function keysFor(kid: string | undefined) {
  if (keyCache && Date.now() - keyCache.loadedAt < KEY_CACHE_MS && (!kid || keyCache.kids.has(kid))) {
    return keyCache.keySet
  }
  return (await loadKeys()).keySet
}

/** Clears the cached signing keys. For tests. */
export function clearAccessTokenKeyCache() {
  keyCache = null
}

/**
 * Verifies `token` for the API at `audience` (its resource URL). Throws an
 * AccessTokenError when the token is not valid for that API.
 */
export async function verifyAccessToken(token: string, audience: string): Promise<VerifiedAccessToken> {
  let kid: string | undefined
  try {
    kid = decodeProtectedHeader(token).kid
  } catch {
    throw new AccessTokenError('The access token is not a JWT. Request it with the resource parameter set to this API.')
  }

  let payload
  try {
    ;({ payload } = await jwtVerify(token, await keysFor(kid), {
      issuer: tokenIssuer(),
      audience,
      typ: 'at+jwt',
    }))
  } catch (error) {
    throw new AccessTokenError(`The access token is not valid for this API: ${(error as Error).message}`)
  }

  // A token bound to a DPoP key (cnf) needs a proof this API does not check.
  if (payload.cnf) throw new AccessTokenError('DPoP-bound access tokens are not supported.')
  const userId = typeof payload.sub === 'string' ? payload.sub : null
  const clientId = typeof payload.azp === 'string' ? payload.azp : null
  if (!userId || !clientId) throw new AccessTokenError('The access token has no user or client.')

  const sessionId = typeof payload.sid === 'string' ? payload.sid : null
  const [user, client, session] = await Promise.all([
    adminDb.users.findUnique({ where: { id: userId }, select: { id: true } }),
    adminDb.oauth_clients.findUnique({ where: { clientId }, select: { disabled: true } }),
    sessionId ? adminDb.sessions.findUnique({ where: { id: sessionId }, select: { expiresAt: true } }) : null,
  ])
  if (!user) throw new AccessTokenError('The user of the access token does not exist.')
  if (!client || client.disabled) throw new AccessTokenError('The client of the access token is not active.')
  if (sessionId && (!session || session.expiresAt < new Date())) {
    throw new AccessTokenError('The sign-in session of the access token has ended.')
  }

  const scopes = typeof payload.scope === 'string' ? payload.scope.split(' ').filter(Boolean) : []
  return { userId, clientId, scopes }
}

// @vitest-environment node
import { exportJWK, generateKeyPair, SignJWT } from 'jose'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const db = vi.hoisted(() => ({
  jwks: { findMany: vi.fn() },
  users: { findUnique: vi.fn() },
  oauth_clients: { findUnique: vi.fn() },
  sessions: { findUnique: vi.fn() },
}))
vi.mock('@/lib/db', () => ({ adminDb: db }))

import { AccessTokenError, clearAccessTokenKeyCache, verifyAccessToken } from '@/lib/api/access-token'

const issuer = 'http://localhost:3000/api/auth'
const audience = 'http://localhost:3000/api/mcp'
const kid = '0f6a2b5e-7c1d-4e8f-9a3b-2c4d5e6f7a8b'
let privateKey: CryptoKey

beforeAll(async () => {
  const pair = await generateKeyPair('EdDSA', { extractable: true })
  privateKey = pair.privateKey
  // Better Auth stores the public JWK without kid; the row id is the kid.
  db.jwks.findMany.mockResolvedValue([{ id: kid, publicKey: JSON.stringify(await exportJWK(pair.publicKey)), alg: 'EdDSA', expiresAt: null }])
})

beforeEach(() => {
  clearAccessTokenKeyCache()
  db.users.findUnique.mockResolvedValue({ id: 'user-1' })
  db.oauth_clients.findUnique.mockResolvedValue({ disabled: false })
  db.sessions.findUnique.mockResolvedValue({ expiresAt: new Date(Date.now() + 60_000) })
})

function token(claims: Record<string, unknown> = {}, options: { typ?: string; expiresIn?: string; aud?: string } = {}) {
  return new SignJWT({ azp: 'client-1', client_id: 'client-1', scope: 'tracking:read tracking:write', sid: 'session-1', ...claims })
    .setProtectedHeader({ alg: 'EdDSA', kid, typ: options.typ ?? 'at+jwt' })
    .setSubject('user-1')
    .setIssuer(issuer)
    .setAudience(options.aud ?? audience)
    .setIssuedAt()
    .setExpirationTime(options.expiresIn ?? '1h')
    .sign(privateKey)
}

describe('verifyAccessToken', () => {
  it('accepts a token from this app for this API', async () => {
    expect(await verifyAccessToken(await token(), audience)).toEqual({
      userId: 'user-1',
      clientId: 'client-1',
      scopes: ['tracking:read', 'tracking:write'],
    })
  })

  it.each([
    ['a token for another API', () => token({}, { aud: 'http://localhost:3000/api/v1' })],
    ['an expired token', () => token({}, { expiresIn: '-1m' })],
    ['an ID token (not typ at+jwt)', () => token({}, { typ: 'JWT' })],
    ['a DPoP-bound token', () => token({ cnf: { jkt: 'thumbprint' } })],
    ['an opaque token', async () => 'opaque-token-value'],
  ])('refuses %s', async (_name, makeToken) => {
    await expect(verifyAccessToken(await makeToken(), audience)).rejects.toBeInstanceOf(AccessTokenError)
  })

  it('refuses a token whose user, client or session is gone', async () => {
    const valid = await token()
    db.users.findUnique.mockResolvedValueOnce(null)
    await expect(verifyAccessToken(valid, audience)).rejects.toThrow('user')
    db.oauth_clients.findUnique.mockResolvedValueOnce({ disabled: true })
    await expect(verifyAccessToken(valid, audience)).rejects.toThrow('client')
    db.sessions.findUnique.mockResolvedValueOnce({ expiresAt: new Date(Date.now() - 1000) })
    await expect(verifyAccessToken(valid, audience)).rejects.toThrow('session')
  })
})

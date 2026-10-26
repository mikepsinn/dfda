// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { middleware } from '@/middleware'

const { getSession, fetchUserProfile, findInstanceForRequest, findFirst, logError } = vi.hoisted(() => ({
  getSession: vi.fn(),
  fetchUserProfile: vi.fn(),
  findInstanceForRequest: vi.fn(),
  findFirst: vi.fn(),
  logError: vi.fn(),
}))
vi.mock('@/lib/auth', () => ({ auth: { api: { getSession } } }))
vi.mock('@/lib/profile', () => ({ fetchUserProfile }))
vi.mock('@/lib/db', () => ({ dbAs: () => ({ instances: { findFirst } }) }))
vi.mock('@/lib/instance/hosts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/instance/hosts')>()),
  findInstanceForRequest,
}))
vi.mock('@/lib/logger', () => ({ logger: { error: logError } }))

function request(path: string, cookie?: string) {
  return new NextRequest(`https://prototype.dfda.earth${path}`, { headers: cookie ? { cookie } : {} })
}

const sessionCookie = '__Secure-better-auth.session_token=token.signature'

// Braces: a function that beforeEach returns runs after the test, and the mock is one.
beforeEach(() => {
  vi.resetAllMocks()
  findInstanceForRequest.mockResolvedValue(null)
  findFirst.mockResolvedValue(null)
})

/** True when the middleware lets the request through to the page. */
function continues(response: Response) {
  return response.headers.get('x-middleware-next') === '1'
}

describe('middleware', () => {
  it('does not read the session without a session cookie', async () => {
    expect(continues(await middleware(request('/treatments')))).toBe(true)
    expect(getSession).not.toHaveBeenCalled()
  })

  it('sends a signed-in user without a role to /select-role', async () => {
    getSession.mockResolvedValue({ user: { id: 'user-1', email: 'a@example.com' } })
    fetchUserProfile.mockResolvedValue({ id: 'user-1', user_type: null })
    const response = await middleware(request('/treatments', sessionCookie))
    expect(response.status).toBe(307)
    expect(new URL(response.headers.get('location') ?? '').pathname).toBe('/select-role')
  })

  it('lets the request through when the session read fails, instead of a 500', async () => {
    getSession.mockRejectedValue(new Error('connect ECONNREFUSED'))
    const response = await middleware(request('/treatments', sessionCookie))
    expect(continues(response)).toBe(true)
    expect(fetchUserProfile).not.toHaveBeenCalled()
    expect(logError).toHaveBeenCalledWith('Could not read the session in middleware', { error: 'connect ECONNREFUSED' })
  })
})

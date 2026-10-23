// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { authEmailContext, linkOnHost } from '@/lib/instance/auth-email'

const { findInstanceForRequest } = vi.hoisted(() => ({ findInstanceForRequest: vi.fn() }))
vi.mock('@/lib/instance/hosts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/instance/hosts')>()),
  findInstanceForRequest,
}))

const response = {
  slug: 'response',
  name: 'Acme Metabolic',
  primaryColor: '#2fd4be',
  supportEmail: 'help@acme.example',
}

function request(host: string, headers: Record<string, string> = {}) {
  return new Request(`http://internal/api/auth/sign-in/magic-link`, { headers: { host, 'x-forwarded-proto': 'https', ...headers } })
}

// Braces: a function that beforeEach returns runs after the test, and the mock is one.
beforeEach(() => {
  findInstanceForRequest.mockReset()
})

describe('linkOnHost', () => {
  const link =
    'https://prototype.dfda.earth/api/auth/magic-link/verify?token=abc&callbackURL=%2Fauth%2Fcallback%3Fnext%3D%252Fprograms&errorCallbackURL=%2Flogin%3Ferror%3Dexpired'

  it("puts the link and the pages it opens after sign-in on the company's host", () => {
    const moved = new URL(linkOnHost(link, 'https://track.acme.example'))
    expect(moved.origin).toBe('https://track.acme.example')
    expect(moved.pathname).toBe('/api/auth/magic-link/verify')
    expect(moved.searchParams.get('token')).toBe('abc')
    expect(moved.searchParams.get('callbackURL')).toBe('https://track.acme.example/auth/callback?next=%2Fprograms')
    expect(moved.searchParams.get('errorCallbackURL')).toBe('https://track.acme.example/login?error=expired')
  })

  it('keeps a page that is not a path on the site', () => {
    for (const page of ['https://elsewhere.example/', '//elsewhere.example/']) {
      const moved = new URL(linkOnHost(`https://prototype.dfda.earth/x?callbackURL=${encodeURIComponent(page)}`, 'https://track.acme.example'))
      expect(moved.searchParams.get('callbackURL')).toBe(page)
    }
  })
})

describe('authEmailContext', () => {
  it("gives the company and its host for a request to the company's own domain", async () => {
    findInstanceForRequest.mockResolvedValue({ ...response, via: 'domain' })
    expect(await authEmailContext(request('track.acme.example'))).toEqual({
      brand: { name: 'Acme Metabolic', primaryColor: '#2fd4be', supportEmail: 'help@acme.example' },
      origin: 'https://track.acme.example',
    })
    expect(findInstanceForRequest).toHaveBeenCalledWith('track.acme.example', undefined)
  })

  it('gives the company but no host for the preview link, which is on the main site', async () => {
    findInstanceForRequest.mockResolvedValue({ ...response, via: 'preview' })
    const context = await authEmailContext(request('prototype.dfda.earth', { cookie: 'other=1; instance_preview=response' }))
    expect(context?.brand.name).toBe('Acme Metabolic')
    expect(context?.origin).toBeNull()
    expect(findInstanceForRequest).toHaveBeenCalledWith('prototype.dfda.earth', 'response')
  })

  it('gives nothing on the main site, without a request, or when the lookup fails', async () => {
    findInstanceForRequest.mockResolvedValue(null)
    expect(await authEmailContext(request('prototype.dfda.earth'))).toBeNull()
    expect(await authEmailContext(undefined)).toBeNull()
    findInstanceForRequest.mockRejectedValue(new Error('database down'))
    expect(await authEmailContext(request('track.acme.example'))).toBeNull()
  })
})

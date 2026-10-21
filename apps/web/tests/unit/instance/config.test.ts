// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { instanceInputSchema, slugFromName } from '@/lib/instance/config'
import { subdomainSlug } from '@/lib/instance/resolve'

const valid = {
  name: 'Acme Proteomics',
  slug: 'acme',
  tagline: '',
  logoUrl: '',
  primaryColor: '#0F766E',
  backgroundColor: '#FAF9F6',
  font: 'system',
  cornerRadius: 'large',
  products: 'Proteomics panel\nBPC-157, Proteomics panel',
  customDomain: '',
}

describe('instance input', () => {
  it('normalizes the form values', () => {
    expect(instanceInputSchema.parse({ ...valid, customDomain: 'https://Track.Acme.com/start' })).toEqual({
      name: 'Acme Proteomics',
      slug: 'acme',
      tagline: null,
      logoUrl: null,
      primaryColor: '#0f766e',
      backgroundColor: '#faf9f6',
      font: 'system',
      cornerRadius: 'large',
      products: ['Proteomics panel', 'BPC-157'],
      customDomain: 'track.acme.com',
    })
  })

  it.each([
    ['a reserved address', { slug: 'admin' }],
    ['an address with spaces', { slug: 'acme labs' }],
    ['a logo without https', { logoUrl: 'http://acme.com/logo.png' }],
    ['a color name', { primaryColor: 'teal' }],
    ['a middle-gray background, on which no text color is easy to read', { backgroundColor: '#777777' }],
    ['a font that is not in the list', { font: 'comic-sans' }],
    ['a corner size that is not in the list', { cornerRadius: 'huge' }],
    ['a domain without a dot', { customDomain: 'localhost' }],
  ])('refuses %s', (_name, change) => {
    expect(instanceInputSchema.safeParse({ ...valid, ...change }).success).toBe(false)
  })

  it('suggests an address from the company name', () => {
    expect(slugFromName('Acme Proteomics, Inc.')).toBe('acme-proteomics-inc')
  })
})

describe('subdomainSlug', () => {
  it('finds the slug only under the root domain', () => {
    expect(subdomainSlug('acme.dfda.earth', 'dfda.earth')).toBe('acme')
    expect(subdomainSlug('dfda.earth', 'dfda.earth')).toBeNull()
    expect(subdomainSlug('a.b.dfda.earth', 'dfda.earth')).toBeNull()
    expect(subdomainSlug('acme.dfda.earth', undefined)).toBeNull()
  })
})

describe('Vercel domains', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it('gives the DNS record for an apex domain and a subdomain', async () => {
    const { dnsRecordFor } = await import('@/lib/instance/vercel-domains')
    expect(dnsRecordFor('acme.com')).toEqual({ type: 'A', name: '@', value: '76.76.21.21' })
    expect(dnsRecordFor('track.acme.com')).toEqual({ type: 'CNAME', name: 'track', value: 'cname.vercel-dns.com' })
  })

  it('asks for manual setup without Vercel settings', async () => {
    const { addDomainToProject } = await import('@/lib/instance/vercel-domains')
    expect((await addDomainToProject('track.acme.com')).status).toBe('manual')
  })

  it('adds the domain to the Vercel project with the API', async () => {
    vi.stubEnv('VERCEL_API_TOKEN', 'token')
    vi.stubEnv('VERCEL_PROJECT_ID', 'prj_1')
    vi.stubEnv('VERCEL_TEAM_ID', 'team_1')
    const fetchMock = vi.fn(async () => Response.json({ name: 'track.acme.com', verified: true }))
    vi.stubGlobal('fetch', fetchMock)
    const { addDomainToProject } = await import('@/lib/instance/vercel-domains')

    expect(await addDomainToProject('track.acme.com')).toMatchObject({ status: 'added' })
    const [url, init] = fetchMock.mock.calls[0] as unknown as [URL, RequestInit]
    expect(String(url)).toBe('https://api.vercel.com/v10/projects/prj_1/domains?teamId=team_1')
    expect(init.body).toBe(JSON.stringify({ name: 'track.acme.com' }))
  })

  it('reports a refused domain', async () => {
    vi.stubEnv('VERCEL_API_TOKEN', 'token')
    vi.stubEnv('VERCEL_PROJECT_ID', 'prj_1')
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ error: { code: 'invalid_domain', message: 'Invalid domain' } }, { status: 400 })))
    const { addDomainToProject } = await import('@/lib/instance/vercel-domains')
    expect(await addDomainToProject('track.acme.com')).toMatchObject({ status: 'error', message: 'Invalid domain' })
  })
})

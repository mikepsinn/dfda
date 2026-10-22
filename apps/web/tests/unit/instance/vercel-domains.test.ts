// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { isDomainConfigured } from '@/lib/instance/vercel-domains'

const dns = vi.hoisted(() => ({ resolveCname: vi.fn(), resolve4: vi.fn() }))
vi.mock('node:dns/promises', () => ({
  Resolver: class {
    resolveCname = dns.resolveCname
    resolve4 = dns.resolve4
  },
}))

/** A failed lookup as node:dns reports it. */
const dnsError = (code: string) => Object.assign(new Error(code), { code })

describe('isDomainConfigured', () => {
  beforeEach(() => {
    dns.resolveCname.mockReset()
    dns.resolve4.mockReset()
  })

  it('accepts a CNAME to Vercel, the general host or a project host', async () => {
    dns.resolveCname.mockResolvedValueOnce(['cname.vercel-dns.com'])
    expect(await isDomainConfigured('response.example.com')).toBe(true)
    dns.resolveCname.mockResolvedValueOnce(['5f0de91f7e0e5950.vercel-dns-016.com'])
    expect(await isDomainConfigured('response.example.com')).toBe(true)
    expect(dns.resolve4).not.toHaveBeenCalled()
  })

  it("accepts A records with Vercel's addresses only", async () => {
    dns.resolveCname.mockRejectedValue(dnsError('ENODATA'))
    dns.resolve4.mockResolvedValueOnce(['76.76.21.21'])
    expect(await isDomainConfigured('example.com')).toBe(true)
    dns.resolve4.mockResolvedValueOnce(['76.76.21.21', '203.0.113.5'])
    expect(await isDomainConfigured('example.com')).toBe(false)
  })

  it('counts a domain behind a proxy, elsewhere or without records as not pointing here', async () => {
    // Behind a proxy: no CNAME, and the proxy's own addresses.
    dns.resolveCname.mockRejectedValueOnce(dnsError('ENODATA'))
    dns.resolve4.mockResolvedValueOnce(['104.21.48.177', '172.67.155.20'])
    expect(await isDomainConfigured('response.example.com')).toBe(false)

    dns.resolveCname.mockResolvedValueOnce(['example.netlify.app'])
    dns.resolve4.mockResolvedValueOnce(['198.51.100.7'])
    expect(await isDomainConfigured('response.example.com')).toBe(false)

    dns.resolveCname.mockRejectedValueOnce(dnsError('ENOTFOUND'))
    dns.resolve4.mockRejectedValueOnce(dnsError('ENOTFOUND'))
    expect(await isDomainConfigured('response.example.com')).toBe(false)
  })

  it('gives null when the lookup fails', async () => {
    dns.resolveCname.mockRejectedValueOnce(dnsError('ETIMEOUT'))
    expect(await isDomainConfigured('response.example.com')).toBeNull()
  })
})

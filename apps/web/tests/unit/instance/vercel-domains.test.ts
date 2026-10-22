// @vitest-environment node
import { EventEmitter } from 'node:events'
import { Readable } from 'node:stream'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { isDomainConfigured } from '@/lib/instance/vercel-domains'

const dns = vi.hoisted(() => ({ resolveCname: vi.fn(), resolve4: vi.fn() }))
vi.mock('node:dns/promises', () => ({
  Resolver: class {
    resolveCname = dns.resolveCname
    resolve4 = dns.resolve4
  },
}))
const https = vi.hoisted(() => ({ request: vi.fn() }))
vi.mock('node:https', () => ({ request: https.request }))

/** A failed lookup as node:dns reports it. */
const dnsError = (code: string) => Object.assign(new Error(code), { code })

/** The domain answers the next request with this status and body. */
function answers(statusCode: number, body: string) {
  https.request.mockImplementationOnce((_options, onResponse: (response: Readable) => void) => {
    const request = Object.assign(new EventEmitter(), {
      end: () => onResponse(Object.assign(Readable.from([body]), { statusCode, setEncoding: () => undefined })),
      destroy: () => undefined,
    })
    return request
  })
}

/** The connection fails, as with an invalid certificate. */
function fails() {
  https.request.mockImplementationOnce(() => {
    const request = Object.assign(new EventEmitter(), { destroy: () => undefined, end: () => request.emit('error', new Error('certificate')) })
    return request
  })
}

describe('isDomainConfigured', () => {
  beforeEach(() => {
    dns.resolveCname.mockReset()
    dns.resolve4.mockReset()
    https.request.mockReset()
  })

  it('connects a domain whose DNS points to Vercel and that answers as the instance', async () => {
    dns.resolveCname.mockResolvedValueOnce(['5f0de91f7e0e5950.vercel-dns-016.com'])
    dns.resolve4.mockResolvedValueOnce(['216.150.16.193'])
    answers(200, '{"slug":"response"}')
    expect(await isDomainConfigured('response.example.com', 'response')).toBe(true)
    // The request goes to the address that DNS gave, with the domain for the certificate and the site.
    expect(https.request.mock.calls[0][0]).toMatchObject({
      host: '216.150.16.193',
      servername: 'response.example.com',
      path: '/api/instance',
      headers: { host: 'response.example.com' },
    })

    dns.resolveCname.mockRejectedValueOnce(dnsError('ENODATA'))
    dns.resolve4.mockResolvedValueOnce(['76.76.21.21'])
    answers(200, '{"slug":"response"}')
    expect(await isDomainConfigured('example.com', 'response')).toBe(true)
  })

  it('does not connect a domain that Vercel does not serve as this instance yet', async () => {
    for (const answer of [() => answers(404, 'The deployment could not be found on Vercel.'), () => answers(200, '{"slug":"other"}'), fails]) {
      dns.resolveCname.mockResolvedValueOnce(['cname.vercel-dns.com'])
      dns.resolve4.mockResolvedValueOnce(['76.76.21.164'])
      answer()
      expect(await isDomainConfigured('response.example.com', 'response')).toBe(false)
    }
  })

  it('asks nothing of a domain whose DNS does not point to Vercel', async () => {
    // Behind a proxy: no CNAME, and the proxy's own addresses.
    dns.resolveCname.mockRejectedValueOnce(dnsError('ENODATA'))
    dns.resolve4.mockResolvedValueOnce(['104.21.48.177', '172.67.155.20'])
    expect(await isDomainConfigured('response.example.com', 'response')).toBe(false)

    dns.resolveCname.mockRejectedValueOnce(dnsError('ENODATA'))
    dns.resolve4.mockResolvedValueOnce(['76.76.21.21', '203.0.113.5'])
    expect(await isDomainConfigured('example.com', 'response')).toBe(false)

    dns.resolveCname.mockRejectedValueOnce(dnsError('ENOTFOUND'))
    dns.resolve4.mockRejectedValueOnce(dnsError('ENOTFOUND'))
    expect(await isDomainConfigured('response.example.com', 'response')).toBe(false)

    // A CNAME to Vercel whose address is private: no request.
    dns.resolveCname.mockResolvedValueOnce(['cname.vercel-dns.com'])
    dns.resolve4.mockResolvedValueOnce(['10.0.0.5'])
    expect(await isDomainConfigured('response.example.com', 'response')).toBe(false)
    expect(https.request).not.toHaveBeenCalled()
  })

  it('gives null when the DNS lookup fails', async () => {
    dns.resolveCname.mockRejectedValueOnce(dnsError('ETIMEOUT'))
    expect(await isDomainConfigured('response.example.com', 'response')).toBeNull()
  })
})

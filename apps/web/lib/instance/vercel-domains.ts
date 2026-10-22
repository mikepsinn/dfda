import { Resolver } from 'node:dns/promises'
import { request } from 'node:https'
import { env } from '@/lib/env'
import { logger } from '@/lib/logger'

/**
 * A company's own domain on Vercel. addDomainToProject adds it to the Vercel
 * project, so the domain serves this app as soon as its DNS points to Vercel;
 * it needs VERCEL_API_TOKEN and VERCEL_PROJECT_ID (and VERCEL_TEAM_ID for a
 * team project), and without them the owner adds the domain in Vercel by hand.
 * isDomainConfigured needs no token: it reads the domain's DNS, then asks the
 * domain which company's site it serves.
 */

export type DomainSetup =
  | { status: 'added' | 'pending'; dns: DnsRecord[]; message?: string }
  | { status: 'manual'; dns: DnsRecord[] }
  | { status: 'error'; dns: DnsRecord[]; message: string }

export type DnsRecord = { type: 'A' | 'CNAME' | 'TXT'; name: string; value: string }

/** The DNS record that points a domain to Vercel: A for an apex domain, CNAME for a subdomain. */
export function dnsRecordFor(domain: string): DnsRecord {
  const labels = domain.split('.')
  return labels.length <= 2
    ? { type: 'A', name: '@', value: '76.76.21.21' }
    : { type: 'CNAME', name: labels.slice(0, -2).join('.'), value: 'cname.vercel-dns.com' }
}

function vercelUrl(path: string) {
  const url = new URL(`https://api.vercel.com${path}`)
  if (env.VERCEL_TEAM_ID) url.searchParams.set('teamId', env.VERCEL_TEAM_ID)
  return url
}

type VercelDomain = { verified?: boolean; verification?: { type: string; domain: string; value: string }[] }

export async function addDomainToProject(domain: string): Promise<DomainSetup> {
  const dns = [dnsRecordFor(domain)]
  if (!env.VERCEL_API_TOKEN || !env.VERCEL_PROJECT_ID) return { status: 'manual', dns }

  try {
    const response = await fetch(vercelUrl(`/v10/projects/${encodeURIComponent(env.VERCEL_PROJECT_ID)}/domains`), {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.VERCEL_API_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: domain }),
    })
    const body = (await response.json().catch(() => ({}))) as VercelDomain & { error?: { code?: string; message?: string } }
    // A domain that is already on this project is fine.
    if (!response.ok && body.error?.code !== 'domain_already_in_use') {
      logger.warn('Vercel did not add the instance domain', { domain, status: response.status, code: body.error?.code })
      return { status: 'error', dns, message: body.error?.message ?? `Vercel answered ${response.status}.` }
    }
    // Vercel asks for a TXT record when another Vercel account used the domain before.
    const verification = (body.verification ?? []).map((record) => ({
      type: 'TXT' as const,
      name: record.domain,
      value: record.value,
    }))
    return { status: body.verified === false ? 'pending' : 'added', dns: [...dns, ...verification] }
  } catch (error) {
    logger.error('Could not reach Vercel to add the instance domain', {
      domain,
      error: error instanceof Error ? error.message : String(error),
    })
    return { status: 'error', dns, message: 'Could not reach Vercel. Try again later.' }
  }
}

/** The host of a CNAME to Vercel: cname.vercel-dns.com, or a project's own, such as 5f0de91f7e0e5950.vercel-dns-016.com. */
const VERCEL_CNAME = /(^|\.)vercel-dns(-\d+)?\.com\.?$/i
/** Vercel's addresses for an A record, as its domain settings give them. */
const VERCEL_ADDRESSES = new Set(['76.76.21.21', '216.150.1.1', '216.150.16.1'])

/** No record of that type, or no such name: an empty answer, not a failed lookup. */
function noRecords(error: unknown): string[] {
  const code = (error as { code?: string }).code
  if (code === 'ENODATA' || code === 'ENOTFOUND') return []
  throw error
}

/** Addresses that a request must never reach: private, loopback, link-local and shared networks. */
function isPublicIPv4(address: string): boolean {
  const [a, b] = address.split('.').map(Number)
  if (a === 10 || a === 127 || a === 0) return false
  if (a === 172 && b >= 16 && b <= 31) return false
  if (a === 192 && b === 168) return false
  if (a === 169 && b === 254) return false
  if (a === 100 && b >= 64 && b <= 127) return false
  return true
}

/**
 * Whether https://{domain}/api/instance (app/api/instance/route.ts) answers
 * with this instance's slug, from `address`. It connects to that address only,
 * the one that the DNS lookup found, so a change of the domain's DNS cannot
 * send the request elsewhere; the certificate must be valid for the domain.
 */
function answersAsInstance(domain: string, address: string, slug: string): Promise<boolean> {
  return new Promise((resolve) => {
    const req = request(
      { host: address, servername: domain, path: '/api/instance', headers: { host: domain, accept: 'application/json' }, timeout: 3000 },
      (response) => {
        let body = ''
        response.setEncoding('utf8')
        response.on('data', (chunk: string) => {
          body += chunk
          if (body.length > 1024) req.destroy()
        })
        response.on('end', () => {
          try {
            resolve(response.statusCode === 200 && (JSON.parse(body) as { slug?: unknown }).slug === slug)
          } catch {
            resolve(false)
          }
        })
        response.on('close', () => resolve(false))
      },
    )
    req.on('timeout', () => req.destroy())
    req.on('error', () => resolve(false))
    req.end()
  })
}

/**
 * Whether the domain serves this app for the instance `slug`. First DNS: a
 * CNAME to Vercel, or A records with Vercel's addresses only. Then the domain
 * itself must answer as that instance, because DNS can point to Vercel before
 * the domain is added to the Vercel project. Null when the DNS lookup fails.
 *
 * A domain behind a proxy such as Cloudflare's (orange cloud) hides its
 * records, so it counts as not connected; the care team's links then use the
 * preview link, which always works.
 */
export async function isDomainConfigured(domain: string, slug: string): Promise<boolean | null> {
  const resolver = new Resolver({ timeout: 2000, tries: 2 })
  let addresses: string[]
  try {
    const cnames = await resolver.resolveCname(domain).catch(noRecords)
    addresses = await resolver.resolve4(domain).catch(noRecords)
    const toVercel = cnames.some((name) => VERCEL_CNAME.test(name)) || addresses.every((address) => VERCEL_ADDRESSES.has(address))
    if (!toVercel || addresses.length === 0) return false
  } catch (error) {
    logger.warn('Could not look up the DNS of an instance domain', {
      domain,
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  }
  const address = addresses.find(isPublicIPv4)
  return address ? answersAsInstance(domain, address, slug) : false
}

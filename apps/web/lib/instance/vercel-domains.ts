import { env } from '@/lib/env'
import { logger } from '@/lib/logger'

/**
 * Adds a company's own domain to the Vercel project, so the domain serves this
 * app as soon as its DNS points to Vercel. Needs VERCEL_API_TOKEN and
 * VERCEL_PROJECT_ID (and VERCEL_TEAM_ID for a team project); without them the
 * owner adds the domain in Vercel by hand.
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

/** Whether DNS already points the domain to Vercel. Null when it cannot be checked. */
export async function isDomainConfigured(domain: string): Promise<boolean | null> {
  if (!env.VERCEL_API_TOKEN) return null
  try {
    const response = await fetch(vercelUrl(`/v6/domains/${encodeURIComponent(domain)}/config`), {
      headers: { Authorization: `Bearer ${env.VERCEL_API_TOKEN}` },
      cache: 'no-store',
    })
    if (!response.ok) return null
    const body = (await response.json()) as { misconfigured?: boolean }
    return body.misconfigured === false
  } catch (error) {
    logger.warn('Could not check the DNS of an instance domain', {
      domain,
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  }
}

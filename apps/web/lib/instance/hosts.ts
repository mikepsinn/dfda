import { dbAs } from '@/lib/db'
import { env } from '@/lib/env'
import type { InstanceBranding } from './config'

const select = {
  slug: true,
  name: true,
  tagline: true,
  logo_url: true,
  primary_color: true,
  products: true,
  custom_domain: true,
} as const

type InstanceRow = {
  slug: string
  name: string
  tagline: string | null
  logo_url: string | null
  primary_color: string
  products: string[]
  custom_domain: string | null
}

function toBranding(row: InstanceRow): InstanceBranding {
  return {
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    logoUrl: row.logo_url,
    primaryColor: row.primary_color,
    products: row.products,
    customDomain: row.custom_domain,
  }
}

/** The host name of a Host header value: lower case, without the port. */
export function hostName(value: string | null | undefined): string {
  return (value ?? '').split(',')[0].trim().toLowerCase().replace(/:\d+$/, '')
}

/** The subdomain slug of `host` under the configured root domain, if any. */
export function subdomainSlug(host: string, rootDomain: string | undefined): string | null {
  if (!rootDomain) return null
  const suffix = `.${rootDomain.toLowerCase()}`
  if (!host.endsWith(suffix)) return null
  const slug = host.slice(0, -suffix.length)
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ? slug : null
}

/** The instance served on `host`: by its own domain, or by its subdomain. Branding is public. */
export async function findInstanceByHost(host: string): Promise<(InstanceBranding & { via: 'domain' | 'subdomain' }) | null> {
  if (!host) return null
  const db = dbAs(null)
  const byDomain = await db.instances.findUnique({ where: { custom_domain: host }, select })
  if (byDomain) return { ...toBranding(byDomain), via: 'domain' }
  const slug = subdomainSlug(host, env.INSTANCE_ROOT_DOMAIN)
  const bySubdomain = slug ? await db.instances.findUnique({ where: { slug }, select }) : null
  return bySubdomain ? { ...toBranding(bySubdomain), via: 'subdomain' } : null
}

/** The instance with this slug, for the preview link. */
export async function findInstanceBySlug(slug: string): Promise<InstanceBranding | null> {
  const row = await dbAs(null).instances.findUnique({ where: { slug }, select })
  return row ? toBranding(row) : null
}

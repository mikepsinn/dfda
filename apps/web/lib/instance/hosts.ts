import { dbAs } from '@/lib/db'
import { env } from '@/lib/env'
import type { InstanceBranding } from './config'
import type { CornerRadius, InstanceFont } from './theme'

/** The cookie of the preview link /i/{slug}: the visitor sees the site with that branding. */
export const PREVIEW_COOKIE = 'instance_preview'

export type ResolvedInstance = InstanceBranding & {
  /** How the request found the instance: its own domain, its subdomain, or the preview cookie. */
  via: 'domain' | 'subdomain' | 'preview'
}

const select = {
  slug: true,
  name: true,
  tagline: true,
  logo_url: true,
  primary_color: true,
  background_color: true,
  font: true,
  corner_radius: true,
  products: true,
  custom_domain: true,
  support_email: true,
} as const

type InstanceRow = {
  slug: string
  name: string
  tagline: string | null
  logo_url: string | null
  primary_color: string
  background_color: string
  font: string
  corner_radius: string
  products: string[]
  custom_domain: string | null
  support_email: string | null
}

/** The branding of an instances row. The table's checks allow only the fonts and corner sizes of lib/instance/theme.ts. */
export function toBranding(row: InstanceRow): InstanceBranding {
  return {
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    logoUrl: row.logo_url,
    primaryColor: row.primary_color,
    backgroundColor: row.background_color,
    font: row.font as InstanceFont,
    cornerRadius: row.corner_radius as CornerRadius,
    products: row.products,
    customDomain: row.custom_domain,
    supportEmail: row.support_email,
  }
}

/** The host of a request (with its port) and the origin that the browser used. */
export function requestOrigin(request: Request): { host: string; origin: string } {
  const hostHeader = (request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? '').split(',')[0].trim().toLowerCase()
  const protocol = request.headers.get('x-forwarded-proto')?.split(',')[0].trim() ?? new URL(request.url).protocol.replace(':', '')
  return { host: hostName(hostHeader), origin: `${protocol}://${hostHeader}` }
}

/**
 * Where people open a company's site: its own domain once its DNS is
 * connected, else its subdomain. Null when it has neither: then only the
 * preview link on the main site shows it.
 */
export function companySiteOrigin(instance: { slug: string; customDomain: string | null }, domainConnected: boolean | null): string | null {
  if (instance.customDomain && domainConnected) return `https://${instance.customDomain}`
  if (env.INSTANCE_ROOT_DOMAIN) return `https://${instance.slug}.${env.INSTANCE_ROOT_DOMAIN}`
  return null
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

/** The instance of a request: by its host, else by the slug in the preview cookie. Null for the main site. */
export async function findInstanceForRequest(host: string, previewSlug: string | undefined): Promise<ResolvedInstance | null> {
  const byHost = await findInstanceByHost(host)
  if (byHost) return byHost
  const byPreview = previewSlug ? await findInstanceBySlug(previewSlug) : null
  return byPreview ? { ...byPreview, via: 'preview' } : null
}

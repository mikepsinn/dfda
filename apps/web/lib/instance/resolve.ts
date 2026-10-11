import { cache } from 'react'
import { cookies, headers } from 'next/headers'
import { logger } from '@/lib/logger'
import type { InstanceBranding } from './config'
import { findInstanceByHost, findInstanceBySlug, hostName } from './hosts'

export { subdomainSlug } from './hosts'

/** The cookie of the preview link /i/{slug}: the visitor sees the site with that branding. */
export const PREVIEW_COOKIE = 'instance_preview'

export type ResolvedInstance = InstanceBranding & {
  /** How the request found the instance: its own domain, its subdomain, or the preview cookie. */
  via: 'domain' | 'subdomain' | 'preview'
}

/**
 * The company instance of the current request: by its own domain, by its
 * subdomain, or by the preview cookie. Null for the main site. A failed
 * lookup is logged and shows the main site, so branding never breaks a page.
 */
export const resolveInstance = cache(async (): Promise<ResolvedInstance | null> => {
  const requestHeaders = await headers()
  const host = hostName(requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host'))
  try {
    const byHost = await findInstanceByHost(host)
    if (byHost) return byHost

    const previewSlug = (await cookies()).get(PREVIEW_COOKIE)?.value
    const byPreview = previewSlug ? await findInstanceBySlug(previewSlug) : null
    if (byPreview) return { ...byPreview, via: 'preview' }
  } catch (error) {
    logger.error('Could not look up the company instance; showing the main site', {
      host,
      error: error instanceof Error ? error.message : String(error),
    })
  }
  return null
})

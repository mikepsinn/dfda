import { cache } from 'react'
import { cookies, headers } from 'next/headers'
import { logger } from '@/lib/logger'
import { findInstanceForRequest, hostName, PREVIEW_COOKIE, type ResolvedInstance } from './hosts'

export { subdomainSlug, PREVIEW_COOKIE, type ResolvedInstance } from './hosts'

/**
 * The company instance of the current request: by its own domain, by its
 * subdomain, or by the preview cookie. Null for the main site. A failed
 * lookup is logged and shows the main site, so branding never breaks a page.
 */
export const resolveInstance = cache(async (): Promise<ResolvedInstance | null> => {
  const requestHeaders = await headers()
  const host = hostName(requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host'))
  try {
    return await findInstanceForRequest(host, (await cookies()).get(PREVIEW_COOKIE)?.value)
  } catch (error) {
    logger.error('Could not look up the company instance; showing the main site', {
      host,
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  }
})

/** The origin of the current request, as the browser used it. */
export async function requestSiteOrigin(): Promise<string> {
  const requestHeaders = await headers()
  const host = (requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host') ?? '').split(',')[0].trim().toLowerCase()
  const protocol = requestHeaders.get('x-forwarded-proto')?.split(',')[0].trim() ?? 'https'
  return `${protocol}://${host}`
}

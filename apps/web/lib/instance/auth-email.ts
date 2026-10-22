import type { EmailBrand } from '@/lib/email'
import { logger } from '@/lib/logger'
import { findInstanceForRequest, PREVIEW_COOKIE, requestOrigin } from './hosts'

/**
 * Sign-in and password emails for a company's site. The sign-in library
 * builds every link on the main site and resolves the page to open after
 * sign-in against it, so a person who asked on the company's own domain or
 * subdomain would be signed in on the main site. These helpers put the link,
 * and the pages it opens, on the host that the person used, and give the
 * email the company's name, color and support address.
 */

/** The company of a sign-in request, and its host when the request came to it (not through the preview link). */
export type AuthEmailContext = { brand: EmailBrand; origin: string | null }

/** The company of an auth request; null on the main site, without a request, or when the lookup fails. */
export async function authEmailContext(request: Request | undefined): Promise<AuthEmailContext | null> {
  if (!request) return null
  const { host, origin } = requestOrigin(request)
  const preview = new RegExp(`(?:^|;\\s*)${PREVIEW_COOKIE}=([^;]+)`).exec(request.headers.get('cookie') ?? '')?.[1]
  try {
    const instance = await findInstanceForRequest(host, preview ? decodeURIComponent(preview) : undefined)
    if (!instance) return null
    return {
      brand: { name: instance.name, primaryColor: instance.primaryColor, supportEmail: instance.supportEmail },
      origin: instance.via === 'preview' ? null : origin,
    }
  } catch (error) {
    logger.error('Could not look up the company of a sign-in email; sending it unbranded', {
      host,
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  }
}

const PAGES_AFTER_SIGN_IN = ['callbackURL', 'errorCallbackURL', 'newUserCallbackURL']

/** An email link from the sign-in library, on `origin`, with the pages that it opens after sign-in on the same host. */
export function linkOnHost(url: string, origin: string): string {
  const link = new URL(url)
  const target = new URL(origin)
  link.protocol = target.protocol
  link.host = target.host
  for (const name of PAGES_AFTER_SIGN_IN) {
    const page = link.searchParams.get(name)
    // A path on this site; never a full address or a protocol-relative one.
    if (page?.startsWith('/') && !page.startsWith('//')) link.searchParams.set(name, new URL(page, target).toString())
  }
  return link.toString()
}

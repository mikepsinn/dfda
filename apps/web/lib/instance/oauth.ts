import { adminDb } from '@/lib/db'
import { apiResources, issuerAt, resourceScopes, resourceUrl, siteOrigin, tokenIssuer, type ApiResource } from '@/lib/oauth-resources'
import { findInstanceByHost, requestOrigin } from './hosts'

/**
 * The MCP server, the REST API and the OAuth server on a company's own
 * address (its domain or subdomain), so that a member who connects an AI app
 * to https://<company>/api/mcp signs in and approves the app on the company's
 * site, with its brand, and never sees the main site.
 *
 * There is one OAuth server (lib/auth.ts). On a company's address its
 * metadata names the company's address as the issuer, and its endpoints are
 * on that address; the company's APIs are OAuth resources of their own
 * (oauth_resources rows), so that a token for one company's address is not
 * accepted on another's or on the main site. The access tokens still carry
 * the main site's issuer, which only this app checks (lib/api/access-token.ts).
 */

/** The origin of a request on a company's own address; null on the main site and on the preview link. */
export async function companyOrigin(request: Request): Promise<string | null> {
  const { host, origin } = requestOrigin(request)
  if (!host || origin === siteOrigin()) return null
  return (await findInstanceByHost(host)) ? origin : null
}

/** The address that a request's APIs and OAuth server have: the company's, or the main site's. */
export async function apiOrigin(request: Request): Promise<string> {
  return (await companyOrigin(request)) ?? siteOrigin()
}

/**
 * Registers the APIs of a company's address as OAuth resources, with the same
 * scopes as the main site's (lib/auth.ts). Run before a client can ask for a
 * token: when it reads the metadata. Rows that exist stay as they are.
 */
export async function ensureCompanyResources(origin: string): Promise<void> {
  const now = new Date()
  await adminDb.oauth_resources.createMany({
    data: (Object.keys(apiResources) as ApiResource[]).map((resource) => ({
      identifier: resourceUrl(resource, origin),
      name: apiResources[resource].name,
      allowedScopes: resourceScopes,
      dpopBoundAccessTokensRequired: false,
      disabled: false,
      policyVersion: 1,
      createdAt: now,
      updatedAt: now,
    })),
    skipDuplicates: true,
  })
}

/** `value` with the main site's address replaced by `origin` in each URL, at any depth. */
export function onCompanyAddress<T>(value: T, origin: string): T {
  const site = siteOrigin()
  if (typeof value === 'string') {
    return (value === site || value.startsWith(`${site}/`) ? origin + value.slice(site.length) : value) as T
  }
  if (Array.isArray(value)) return value.map((item) => onCompanyAddress(item, origin)) as T
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, onCompanyAddress(item, origin)])) as T
  }
  return value
}

/** The `iss` parameter of an authorization response (RFC 9207), as it is in a URL. */
function issParam(issuer: string): string {
  return new URLSearchParams({ iss: issuer }).toString()
}

/**
 * An OAuth response of the auth handler on a company's address, with the
 * company's issuer in the `iss` parameter of the authorization response: a
 * client compares it with the issuer of the metadata that it read there. The
 * parameter is in the redirect (Location) of the authorization endpoint, and
 * in the JSON that the consent page and a sign-in during an authorization
 * get. A redirect to the main site (such as its error page for a request
 * that is not valid) goes to the same path on the company's address. Other
 * responses are unchanged.
 */
export async function onCompanyAuthResponse(request: Request, response: Response): Promise<Response> {
  if (!new URL(request.url).pathname.includes('/oauth2/')) return response
  const origin = await companyOrigin(request)
  if (!origin) return response
  const from = issParam(tokenIssuer())
  const to = issParam(issuerAt(origin))
  const headers = new Headers(response.headers)
  const location = headers.get('location')
  if (location) headers.set('location', onCompanyAddress(location.replaceAll(from, to), origin))
  if (!headers.get('content-type')?.includes('application/json')) {
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
  }
  const text = await response.text()
  headers.delete('content-length')
  return new Response(text.replaceAll(from, to), { status: response.status, statusText: response.statusText, headers })
}

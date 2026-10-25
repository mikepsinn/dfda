import { getBaseUrl } from '@/lib/url'

/**
 * The APIs that accept access tokens from this app's OAuth server
 * (lib/auth.ts): the MCP server and the REST API for personal tracking.
 *
 * Each API is an OAuth resource (RFC 8707). A client asks for a token for one
 * of them with the `resource` parameter, and gets a signed JWT whose audience
 * is that API's URL. Tokens for one API are not accepted by the other.
 *
 * A company site serves the same APIs and OAuth server on its own address
 * (`origin`), so that its members sign in on the company's site
 * (lib/instance/oauth.ts). The main site's address is the default.
 */

/** Read the user's own measurements, variables, reminders and notifications. */
export const TRACKING_READ_SCOPE = 'tracking:read'
/** Record, change and delete them, and answer reminder notifications. */
export const TRACKING_WRITE_SCOPE = 'tracking:write'
export const trackingScopes = [TRACKING_READ_SCOPE, TRACKING_WRITE_SCOPE] as const
export type TrackingScope = (typeof trackingScopes)[number]
/** The scopes that a token for the APIs can have. */
export const resourceScopes = [...trackingScopes, 'offline_access']

export const apiResources = {
  mcp: { path: '/api/mcp', name: 'MCP server for personal tracking' },
  rest: { path: '/api/v1', name: 'REST API for personal tracking' },
} as const
export type ApiResource = keyof typeof apiResources

export function siteOrigin(): string {
  return getBaseUrl().replace(/\/$/, '')
}

/**
 * The issuer of the access tokens, as Better Auth sets it: the main site and
 * its auth path. Tokens from a company's address have it too.
 */
export function tokenIssuer(): string {
  return issuerAt(siteOrigin())
}

/** The OAuth server's identifier at `origin`, as its metadata names it. */
export function issuerAt(origin: string): string {
  return `${origin}/api/auth`
}

/** The resource identifier: the `resource` parameter value and the tokens' audience. */
export function resourceUrl(resource: ApiResource, origin = siteOrigin()): string {
  return origin + apiResources[resource].path
}

/** Where the protected-resource metadata (RFC 9728) for `resource` is served. */
export function protectedResourceMetadataUrl(resource: ApiResource, origin = siteOrigin()): string {
  return `${origin}/.well-known/oauth-protected-resource${apiResources[resource].path}`
}

/** Protected-resource metadata (RFC 9728): tells clients where to get a token and which scopes exist. */
export function protectedResourceMetadata(resource: ApiResource, origin = siteOrigin()) {
  return {
    resource: resourceUrl(resource, origin),
    authorization_servers: [issuerAt(origin)],
    scopes_supported: [...trackingScopes],
    bearer_methods_supported: ['header'],
    resource_name: apiResources[resource].name,
    // The documentation is a page of the main site, which a company's site does not show.
    ...(origin === siteOrigin() ? { resource_documentation: `${siteOrigin()}/developers` } : {}),
  }
}

import { getBaseUrl } from '@/lib/url'

/**
 * The APIs that accept access tokens from this app's OAuth server
 * (lib/auth.ts): the MCP server and the REST API for personal tracking.
 *
 * Each API is an OAuth resource (RFC 8707). A client asks for a token for one
 * of them with the `resource` parameter, and gets a signed JWT whose audience
 * is that API's URL. Tokens for one API are not accepted by the other.
 */

/** Read the user's own measurements, variables, reminders and notifications. */
export const TRACKING_READ_SCOPE = 'tracking:read'
/** Record, change and delete them, and answer reminder notifications. */
export const TRACKING_WRITE_SCOPE = 'tracking:write'
export const trackingScopes = [TRACKING_READ_SCOPE, TRACKING_WRITE_SCOPE] as const
export type TrackingScope = (typeof trackingScopes)[number]

export const apiResources = {
  mcp: { path: '/api/mcp', name: 'MCP server for personal tracking' },
  rest: { path: '/api/v1', name: 'REST API for personal tracking' },
} as const
export type ApiResource = keyof typeof apiResources

export function siteOrigin(): string {
  return getBaseUrl().replace(/\/$/, '')
}

/** The issuer of the access tokens, as Better Auth sets it: the site and its auth path. */
export function tokenIssuer(): string {
  return `${siteOrigin()}/api/auth`
}

/** The resource identifier: the `resource` parameter value and the tokens' audience. */
export function resourceUrl(resource: ApiResource): string {
  return siteOrigin() + apiResources[resource].path
}

/** Where the protected-resource metadata (RFC 9728) for `resource` is served. */
export function protectedResourceMetadataUrl(resource: ApiResource): string {
  return `${siteOrigin()}/.well-known/oauth-protected-resource${apiResources[resource].path}`
}

/** Protected-resource metadata (RFC 9728): tells clients where to get a token and which scopes exist. */
export function protectedResourceMetadata(resource: ApiResource) {
  return {
    resource: resourceUrl(resource),
    authorization_servers: [tokenIssuer()],
    scopes_supported: [...trackingScopes],
    bearer_methods_supported: ['header'],
    resource_name: apiResources[resource].name,
    resource_documentation: `${siteOrigin()}/developers`,
  }
}

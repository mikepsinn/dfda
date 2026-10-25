import { apiOrigin } from '@/lib/instance/oauth'
import { logger } from '@/lib/logger'
import { protectedResourceMetadataUrl, resourceUrl, type ApiResource, type TrackingScope } from '@/lib/oauth-resources'
import { TrackingError } from '@/lib/tracking/errors'
import { AccessTokenError, verifyAccessToken, type VerifiedAccessToken } from './access-token'

/**
 * Request checks and responses shared by the MCP server and the REST API.
 * Clients send an access token in the Authorization header; there are no
 * cookies, so any origin may call the APIs.
 */

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, Mcp-Session-Id, Mcp-Protocol-Version, Last-Event-ID',
  'Access-Control-Expose-Headers': 'WWW-Authenticate, Mcp-Session-Id, Mcp-Protocol-Version',
}

export function preflightResponse(methods: string): Response {
  return new Response(null, { status: 204, headers: { ...corsHeaders, 'Access-Control-Allow-Methods': methods } })
}

export function errorResponse(status: number, code: string, message: string, extra: { headers?: Record<string, string>; details?: unknown } = {}) {
  return Response.json(
    { error: { code, message, ...(extra.details ? { details: extra.details } : {}) } },
    { status, headers: { ...corsHeaders, ...extra.headers } },
  )
}

/**
 * A 401 or 403 response. WWW-Authenticate points at the protected-resource
 * metadata (RFC 9728) on the address of the request (`origin`: the main
 * site's or a company's, lib/instance/oauth.ts), from which MCP clients find
 * the OAuth server.
 */
function authErrorResponse(resource: ApiResource, origin: string, status: 401 | 403, error: string | null, message: string, scope?: string) {
  const params = [
    `resource_metadata="${protectedResourceMetadataUrl(resource, origin)}"`,
    ...(error ? [`error="${error}"`, `error_description="${message.replace(/"/g, "'")}"`] : []),
    ...(scope ? [`scope="${scope}"`] : []),
  ]
  return errorResponse(status, error ?? 'unauthorized', message, {
    headers: { 'WWW-Authenticate': `Bearer ${params.join(', ')}` },
  })
}

/**
 * The verified token of a request to `resource`, with the address of the
 * request, or the 401 response to send. A token is valid only for the API
 * on the address that it was issued for.
 */
export async function authenticateRequest(
  req: Request,
  resource: ApiResource,
): Promise<(VerifiedAccessToken & { origin: string }) | Response> {
  const origin = await apiOrigin(req)
  const header = req.headers.get('authorization')
  const token = header?.match(/^Bearer\s+(\S+)$/i)?.[1]
  if (!token) {
    return authErrorResponse(resource, origin, 401, null, `Send an access token for ${resourceUrl(resource, origin)} in the Authorization header.`)
  }
  try {
    return { ...(await verifyAccessToken(token, resourceUrl(resource, origin))), origin }
  } catch (error) {
    if (error instanceof AccessTokenError) {
      return authErrorResponse(resource, origin, 401, 'invalid_token', error.message)
    }
    throw error
  }
}

/** The 403 response for a token without the scope an operation needs, on the address of the request. */
export function insufficientScopeResponse(resource: ApiResource, scope: TrackingScope, origin: string) {
  return authErrorResponse(resource, origin, 403, 'insufficient_scope', `This needs the ${scope} scope.`, scope)
}

/** The response for an error from a tracking operation. */
export function operationErrorResponse(error: unknown, operation: string): Response {
  if (error instanceof TrackingError) return errorResponse(error.status, error.code, error.message)
  logger.error('Tracking API operation failed', {
    operation,
    error: error instanceof Error ? error.message : String(error),
  })
  return errorResponse(500, 'INTERNAL', 'The request failed. Try again later.')
}

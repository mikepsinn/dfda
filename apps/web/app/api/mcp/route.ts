/**
 * MCP server for personal tracking (Streamable HTTP, stateless). Clients sign
 * in through this app's OAuth server with resource=<site>/api/mcp; a request
 * without a valid token gets a 401 that points at the protected-resource
 * metadata, from which MCP clients start the OAuth flow.
 */
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { authenticateRequest, corsHeaders, errorResponse, insufficientScopeResponse, preflightResponse } from '@/lib/api/resource-auth'
import { logger } from '@/lib/logger'
import { createTrackingMcpServer } from '@/lib/mcp/server'
import { TRACKING_READ_SCOPE, trackingScopes } from '@/lib/oauth-resources'

export const dynamic = 'force-dynamic'

async function handle(req: Request): Promise<Response> {
  const token = await authenticateRequest(req, 'mcp')
  if (token instanceof Response) return token
  // Without a tracking scope there are no tools to offer.
  if (!token.scopes.some((scope) => (trackingScopes as readonly string[]).includes(scope))) {
    return insufficientScopeResponse('mcp', TRACKING_READ_SCOPE)
  }
  try {
    // Stateless: a new server and transport for each request, no session id.
    const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true })
    await createTrackingMcpServer(token.userId, token.scopes).connect(transport)
    const response = await transport.handleRequest(req)
    const headers = new Headers(response.headers)
    for (const [name, value] of Object.entries(corsHeaders)) headers.set(name, value)
    return new Response(response.body, { status: response.status, headers })
  } catch (error) {
    logger.error('MCP request failed', { error: error instanceof Error ? error.message : String(error) })
    return errorResponse(500, 'INTERNAL', 'The request failed. Try again later.')
  }
}

export const GET = handle
export const POST = handle
export const DELETE = handle

export function OPTIONS() {
  return preflightResponse('GET, POST, DELETE, OPTIONS')
}

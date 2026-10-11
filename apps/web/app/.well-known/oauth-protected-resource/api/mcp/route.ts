import { corsHeaders } from '@/lib/api/resource-auth'
import { protectedResourceMetadata } from '@/lib/oauth-resources'

// Protected-resource metadata (RFC 9728) for /api/mcp: where clients get an
// access token for it, and which scopes it accepts.
export function GET() {
  return Response.json(protectedResourceMetadata('mcp'), { headers: corsHeaders })
}

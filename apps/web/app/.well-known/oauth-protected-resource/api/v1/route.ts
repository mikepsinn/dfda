import { corsHeaders } from '@/lib/api/resource-auth'
import { protectedResourceMetadata } from '@/lib/oauth-resources'

// Protected-resource metadata (RFC 9728) for /api/v1: where clients get an
// access token for it, and which scopes it accepts.
export function GET() {
  return Response.json(protectedResourceMetadata('rest'), { headers: corsHeaders })
}

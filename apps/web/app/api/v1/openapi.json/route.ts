import { corsHeaders } from '@/lib/api/resource-auth'
import { openApiDocument } from '@/lib/api/openapi'

// The OpenAPI document of the REST API. It is public: it describes the API, not data.
export function GET() {
  return Response.json(openApiDocument(), { headers: corsHeaders })
}

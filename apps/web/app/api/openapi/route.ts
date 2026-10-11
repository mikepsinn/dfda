import { corsHeaders } from '@/lib/api/resource-auth'
import { openApiDocument } from '@/lib/api/openapi'

// The old address of the API document. It now serves the document of the
// app's own REST API, the same as /api/v1/openapi.json.
export function GET() {
  return Response.json(openApiDocument(), { headers: corsHeaders })
}

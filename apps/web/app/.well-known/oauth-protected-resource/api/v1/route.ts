import { corsHeaders } from '@/lib/api/resource-auth'
import { companyOrigin, ensureCompanyResources } from '@/lib/instance/oauth'
import { protectedResourceMetadata, siteOrigin } from '@/lib/oauth-resources'

// Protected-resource metadata (RFC 9728) for /api/v1: where clients get an
// access token for it, and which scopes it accepts. On a company's address,
// the company's own resource and OAuth server (lib/instance/oauth.ts).
export async function GET(req: Request) {
  const company = await companyOrigin(req)
  if (company) await ensureCompanyResources(company)
  return Response.json(protectedResourceMetadata('rest', company ?? siteOrigin()), { headers: corsHeaders })
}

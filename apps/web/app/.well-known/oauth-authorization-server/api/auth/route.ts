import { oauthProviderAuthServerMetadata } from '@better-auth/oauth-provider'
import { auth } from '@/lib/auth'
import { companyOrigin, ensureCompanyResources, onCompanyAddress } from '@/lib/instance/oauth'

// OAuth authorization server metadata (RFC 8414) for the issuer
// <site>/api/auth. MCP clients read it to find the authorization, token and
// registration endpoints. On a company's address, the issuer and the
// endpoints are on that address (lib/instance/oauth.ts).
const metadata = oauthProviderAuthServerMetadata(auth)

export async function GET(req: Request) {
  const response = await metadata(req)
  const company = await companyOrigin(req)
  if (!company || !response.ok) return response
  await ensureCompanyResources(company)
  const headers = new Headers(response.headers)
  headers.delete('content-length')
  return Response.json(onCompanyAddress(await response.json(), company), { status: response.status, headers })
}

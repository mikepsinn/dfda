import { oauthProviderAuthServerMetadata } from '@better-auth/oauth-provider'
import { auth } from '@/lib/auth'

// OAuth authorization server metadata (RFC 8414) for the issuer
// <site>/api/auth. MCP clients read it to find the authorization, token and
// registration endpoints.
export const GET = oauthProviderAuthServerMetadata(auth)

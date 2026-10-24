import { toNextJsHandler } from 'better-auth/next-js'
import { auth } from '@/lib/auth'
import { onCompanyAuthResponse } from '@/lib/instance/oauth'

// Better Auth endpoints: sign-in, sign-out, sessions, OAuth provider and its
// metadata (/api/auth/.well-known/openid-configuration). On a company's
// address, the OAuth responses name the company's issuer (lib/instance/oauth.ts).
const handler = toNextJsHandler(auth)

export async function GET(req: Request) {
  return onCompanyAuthResponse(req, await handler.GET(req))
}

export async function POST(req: Request) {
  return onCompanyAuthResponse(req, await handler.POST(req))
}

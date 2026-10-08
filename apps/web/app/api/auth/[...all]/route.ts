import { toNextJsHandler } from 'better-auth/next-js'
import { auth } from '@/lib/auth'

// Better Auth endpoints: sign-in, sign-out, sessions, OAuth provider and its
// metadata (/api/auth/.well-known/openid-configuration).
export const { GET, POST } = toNextJsHandler(auth)

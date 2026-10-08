import { cache } from 'react'
import { headers } from 'next/headers'
import { getSessionCookie } from 'better-auth/cookies'
import { auth, type AuthUser } from '@/lib/auth'

export type { AuthUser }

/**
 * Returns the signed-in user of the current request, or null.
 *
 * Better Auth checks the session cookie against the sessions table, so the
 * result can be used for authorization. Use it in Server Components, Server
 * Actions and route handlers.
 *
 * Without a session cookie there is no user, so the database is not read.
 * This also keeps static pages (built with no request and no database)
 * working.
 */
export const getServerUser = cache(async (): Promise<AuthUser | null> => {
  const requestHeaders = await headers()
  if (!getSessionCookie(requestHeaders)) return null
  const session = await auth.api.getSession({ headers: requestHeaders })
  return session?.user ?? null
})

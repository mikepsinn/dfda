import { NextResponse, type NextRequest } from 'next/server'
import { getServerUser } from '@/lib/server-auth'
import { dashboardPathFor, fetchUserProfile } from '@/lib/profile'
import { logger } from '@/lib/logger'

/**
 * Where the browser lands after a magic link, Google or password sign-in.
 * Sends the user to the home page of their role, or to /select-role.
 */
export async function GET(request: NextRequest) {
  // Behind a proxy (Docker, Cloud Run) request.url can carry the internal
  // host, so take the public one from the forwarded headers.
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  const protocol = request.headers.get('x-forwarded-proto') ?? request.nextUrl.protocol.replace(':', '')
  const origin = host ? `${protocol}://${host}` : request.nextUrl.origin
  const user = await getServerUser()

  if (!user) {
    logger.warn('[AUTH-CALLBACK-ROUTE] No session after sign-in')
    const loginUrl = new URL('/login', origin)
    loginUrl.searchParams.set('error', 'Could not sign in. Please try again.')
    return NextResponse.redirect(loginUrl)
  }

  let redirectPath = '/'
  try {
    const profile = await fetchUserProfile(user)
    redirectPath = dashboardPathFor(profile?.user_type)
  } catch (error) {
    // The role is unknown; the home page works without it.
    logger.error('[AUTH-CALLBACK-ROUTE] Could not read the profile', {
      userId: user.id,
      error: error instanceof Error ? error.message : error,
    })
  }

  logger.info('[AUTH-CALLBACK-ROUTE] Signed in', { userId: user.id, redirectPath })
  return NextResponse.redirect(new URL(redirectPath, origin))
}

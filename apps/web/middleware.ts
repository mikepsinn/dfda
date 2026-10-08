import { NextResponse, type NextRequest } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'
import { auth } from '@/lib/auth'
import { fetchUserProfile, type Profile } from '@/lib/profile'
import { logger } from '@/lib/logger'

// Paths a signed-in user without a role may still open.
const PATHS_WITHOUT_ROLE = ['/select-role', '/login', '/register', '/auth', '/api/auth', '/oauth', '/.well-known']

export async function middleware(request: NextRequest) {
  // Visitors without a session cookie are not signed in; skip the database.
  const session = getSessionCookie(request.headers) ? await auth.api.getSession({ headers: request.headers }) : null
  const user = session?.user ?? null

  // Read the profile of a signed-in user. When the database read fails, the
  // role is unknown, not missing: do not send the user to /select-role,
  // because that page would ask again for a role they already have.
  let profile: Profile | null = null
  let profileReadFailed = false
  if (user) {
    try {
      profile = await fetchUserProfile(user)
    } catch (error) {
      profileReadFailed = true
      logger.error('Could not read the user profile in middleware', {
        userId: user.id,
        error: error instanceof Error ? error.message : error,
      })
    }
  }

  // A signed-in user without a role chooses one first.
  const { pathname } = request.nextUrl
  if (
    user &&
    !profileReadFailed &&
    !profile?.user_type &&
    !PATHS_WITHOUT_ROLE.some((path) => pathname.startsWith(path))
  ) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/select-role'
    redirectUrl.search = ''
    return NextResponse.redirect(redirectUrl)
  }

  // Adjust the x-forwarded-host header to match the origin
  const requestHeaders = new Headers(request.headers)
  const origin = requestHeaders.get('origin')
  if (origin && origin.includes('127.0.0.1')) {
    requestHeaders.set('x-forwarded-host', origin.split('://')[1])
    return NextResponse.next({
      headers: requestHeaders,
    })
  }

  return NextResponse.next()
}

// Only run middleware on specific paths. The Node.js runtime is required because
// the session and the profile are read from the database.
export const config = {
  runtime: 'nodejs',
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    "/patient/:path*", 
    "/provider/:path*", 
    "/research-partner/:path*", 
    "/developer/:path*",
    "/user/:path*", 
    "/login", 
    "/register"
  ],
}

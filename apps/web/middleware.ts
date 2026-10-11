import { NextResponse, type NextRequest } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'
import { auth } from '@/lib/auth'
import { dbAs } from '@/lib/db'
import { fetchUserProfile, type Profile } from '@/lib/profile'
import { logger } from '@/lib/logger'

// Paths a signed-in user without a role may still open. The MCP server and
// the REST API use access tokens, not the session. A company that creates an
// instance (/instances, /i) needs no patient or provider role, and a person
// who opens a program (/programs) gets the patient role when they join it.
const PATHS_WITHOUT_ROLE = ['/select-role', '/login', '/register', '/auth', '/api/auth', '/oauth', '/.well-known', '/api/mcp', '/api/v1', '/instances', '/i', '/programs']

/** Whether the user owns a company instance. A failed read counts as yes, so the user is not sent away. */
async function ownsInstance(userId: string) {
  try {
    return Boolean(await dbAs({ id: userId }).instances.findFirst({ where: { owner_id: userId }, select: { id: true } }))
  } catch (error) {
    logger.error('Could not check the instances of a user in middleware', {
      userId,
      error: error instanceof Error ? error.message : error,
    })
    return true
  }
}

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

  // A signed-in user without a role chooses one first. A company that owns
  // an instance has its role already: it runs the instance.
  const { pathname } = request.nextUrl
  if (
    user &&
    !profileReadFailed &&
    !profile?.user_type &&
    !PATHS_WITHOUT_ROLE.some((path) => pathname === path || pathname.startsWith(`${path}/`)) &&
    !(await ownsInstance(user.id))
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

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res: response })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Check if the user is authenticated
  const isAuthenticated = !!session

  // Define protected routes
  const protectedPaths = [
    "/patient/dashboard",
    "/patient/find-trials",
    "/patient/data-submission",
    "/doctor/dashboard",
    "/doctor/find-trials",
    "/sponsor/dashboard",
    "/sponsor/create-trial",
    "/user/profile",
  ]

  // Check if the current path is protected
  const isProtectedPath = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path))

  // Redirect to login if accessing a protected route without authentication
  if (isProtectedPath && !isAuthenticated) {
    const redirectUrl = new URL("/login", request.url)
    redirectUrl.searchParams.set("redirect", request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect to dashboard if accessing auth pages while authenticated
  const authPaths = ["/login", "/register"]
  const isAuthPath = authPaths.some((path) => request.nextUrl.pathname === path)

  if (isAuthPath && isAuthenticated) {
    // Determine which dashboard to redirect to based on user type
    // In a real app, you would check the user's type in the session
    return NextResponse.redirect(new URL("/patient/dashboard", request.url))
  }

  return response
}

// Only run middleware on specific paths
export const config = {
  matcher: ["/patient/:path*", "/doctor/:path*", "/sponsor/:path*", "/user/:path*", "/login", "/register"],
}


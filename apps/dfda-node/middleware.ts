import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Update session and get response object
  const response = await updateSession(request)

  // Re-create supabase client for auth check (necessary after updateSession potentially modifies cookies)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          // We might need to pass the updated response object here if set is called
          // For auth check, we mainly rely on reading cookies, so this might be okay.
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          // Similarly for remove
        },
      },
    }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  console.log('[AUTH] Current state:', { 
    path: request.nextUrl.pathname,
    isAuthenticated: !!user,
    hasError: !!authError
  });

  const isAuthenticated = !!user

  // Define protected routes
  const protectedPaths = [
    "/patient/dashboard",
    "/patient/find-trials",
    "/patient/data-submission",
    "/provider/dashboard",
    "/provider/find-trials",
    "/research-partner/dashboard",
    "/research-partner/create-trial",
    "/developer/dashboard",
    "/developer/api-keys",
    "/developer/documentation",
    "/user/profile",
  ]

  // Check if the current path is protected
  const isProtectedPath = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path))

  // Redirect to login if accessing a protected route without authentication
  if (isProtectedPath && !isAuthenticated) {
    console.log('[AUTH] Redirecting to login - unauthorized access attempt')
    const redirectUrl = new URL("/login", request.url)
    redirectUrl.searchParams.set("redirect", request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect to dashboard if accessing auth pages while authenticated
  const authPaths = ["/login", "/register"]
  const isAuthPath = authPaths.some((path) => request.nextUrl.pathname === path)

  if (isAuthPath && isAuthenticated) {
    console.log('[AUTH] Redirecting to dashboard - already authenticated')
    return NextResponse.redirect(new URL("/patient/dashboard", request.url))
  }

  // Return the response object from updateSession (contains potentially updated cookies)
  return response
}

// Only run middleware on specific paths
export const config = {
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


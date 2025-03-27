import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
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

  return response
}

// Only run middleware on specific paths
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    "/patient/:path*", 
    "/doctor/:path*", 
    "/sponsor/:path*", 
    "/user/:path*", 
    "/login", 
    "/register"
  ],
}


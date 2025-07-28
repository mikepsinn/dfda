import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getUserProfile } from '@/lib/profile'
import { env } from '@/lib/env'

export async function updateSession(request: NextRequest) {
  // This `try/catch` block is only required for the App Router -> Edge Runtime.
  // If you are using the Pages Router, you can remove the `try/catch` block
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch the user profile if the user object exists
  const profile = user ? await getUserProfile(user) : null;

  // Redirect to select role if user is logged in but user_type is missing from profile
  if (
    user && 
    !profile?.user_type &&
    !request.nextUrl.pathname.startsWith('/select-role') &&
    !request.nextUrl.pathname.startsWith('/login') && // Allow access to login
    !request.nextUrl.pathname.startsWith('/register') && // Allow access to register
    !request.nextUrl.pathname.startsWith('/auth') // Allow access to auth callbacks
  ) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/select-role'
    return NextResponse.redirect(redirectUrl)
  }

  // IMPORTANT: You *must* return the updated response object here.
  // If you don't return the response object, the cookies will not be updated.
  return response
}
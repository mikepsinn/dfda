import type { NextRequest } from "next/server"
import { updateSession } from './utils/supabase/middleware.ts'

export async function middleware(request: NextRequest) {
  // Update session and get response object
  return await updateSession(request)
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


import type { NextRequest } from "next/server"
import { updateSession } from '@/utils/supabase/middleware'
import { NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  // Update session and get response object
  const response = await updateSession(request);
  
  // Adjust the x-forwarded-host header to match the origin
  const requestHeaders = new Headers(request.headers);
  const origin = requestHeaders.get('origin');
  if (origin && origin.includes('127.0.0.1')) {
    requestHeaders.set('x-forwarded-host', origin.split('://')[1]);
    return NextResponse.next({
      headers: requestHeaders,
    });
  }
  
  return response;
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

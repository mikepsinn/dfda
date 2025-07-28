import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    // Redirect to login if not authenticated
    return NextResponse.redirect(new URL("/auth", req.url))
  }

  // Check if user is an admin
  // For development, we'll use a simple email check
  // In production, you would use a more robust check like a database role
  const isAdmin = session.user.email?.includes("admin") || false

  // Add some debug logging in development
  if (process.env.NODE_ENV === "development") {
    console.log(`Admin middleware: User ${session.user.email} is ${isAdmin ? "an admin" : "not an admin"}`)
  }

  if (!isAdmin) {
    // Allow access to the page but the UI will show access denied
    // This gives us a chance to show a more helpful message
    return NextResponse.next()
  }

  return res
}

export const config = {
  matcher: ["/admin/:path*"],
}

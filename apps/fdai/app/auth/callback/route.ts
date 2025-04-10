import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  console.log("Auth callback route hit", {
    url: request.url,
    hasCode: !!code,
  })

  if (code) {
    try {
      const cookieStore = cookies()
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
      const result = await supabase.auth.exchangeCodeForSession(code)

      console.log("Code exchange result:", {
        success: !result.error,
        error: result.error?.message,
        hasSession: !!result.data.session,
      })
    } catch (error) {
      console.error("Error in auth callback:", error)
    }
  } else {
    console.log("No code provided in callback URL")
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(requestUrl.origin)
}

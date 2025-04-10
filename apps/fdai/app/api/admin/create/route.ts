import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  // Only allow in development mode
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "This endpoint is only available in development mode" }, { status: 403 })
  }

  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Check if we have the service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseServiceKey) {
      return NextResponse.json(
        {
          error: "Service role key not found. Please add SUPABASE_SERVICE_ROLE_KEY to your environment variables.",
          needsServiceKey: true,
        },
        { status: 400 },
      )
    }

    // Create a Supabase client with the service role key
    const supabase = createClient(supabaseUrl!, supabaseServiceKey)

    // Check if user already exists
    const { data: existingUser, error: getUserError } = await supabase
      .from("auth.users")
      .select("id, email_confirmed_at")
      .eq("email", email)
      .single()

    if (getUserError && !getUserError.message.includes("No rows found")) {
      return NextResponse.json({ error: `Error checking for existing user: ${getUserError.message}` }, { status: 500 })
    }

    if (existingUser) {
      // User exists, ensure they're confirmed
      if (!existingUser.email_confirmed_at) {
        const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
          email_confirmed_at: new Date().toISOString(),
        })

        if (updateError) {
          return NextResponse.json(
            { error: `Failed to confirm existing user: ${updateError.message}` },
            { status: 500 },
          )
        }
      }

      return NextResponse.json({
        success: true,
        message: "Admin account already exists and is confirmed",
        isExisting: true,
      })
    }

    // Create a new user with admin privileges
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { is_admin: true },
    })

    if (createError) {
      return NextResponse.json({ error: `Failed to create admin user: ${createError.message}` }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Admin account created and confirmed successfully",
      user: newUser,
    })
  } catch (error) {
    console.error("Error in admin creation API:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

"use server"

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DEMO_ACCOUNTS, UserType } from '@/lib/constants/demo-accounts'

export async function demoLogin(userType: UserType = "patient") {
  console.log('[DEMO-LOGIN] Starting demo login', {
    userType,
    timestamp: new Date().toISOString()
  });

  const supabase = await createClient()
  const account = DEMO_ACCOUNTS[userType]

  try {
    console.log('[DEMO-LOGIN] Checking if demo account exists...', {
      email: account.email
    });

    // Check if the demo account exists
    const { data: existingUser, error: checkError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", account.email)
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      console.error("[DEMO-LOGIN] Error checking for demo account:", {
        error: checkError,
        code: checkError.code,
        message: checkError.message
      })
      throw new Error(`Failed to check for demo account: ${checkError.message}`)
    }

    if (!existingUser) {
      console.log('[DEMO-LOGIN] Demo account does not exist, creating new account...');
      // Create the demo account if it doesn't exist
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: account.email,
        password: account.password,
      })

      if (signUpError) {
        console.error("[DEMO-LOGIN] Error creating demo account:", {
          error: signUpError,
          code: signUpError.status,
          message: signUpError.message
        })
        throw new Error(`Failed to create demo account: ${signUpError.message}`)
      }

      console.log('[DEMO-LOGIN] Auth signup successful', {
        userId: authData?.user?.id
      });

      // Create the profile
      if (authData?.user) {
        console.log('[DEMO-LOGIN] Creating demo profile...');
        const { error: profileError } = await supabase.from("profiles").insert({
          id: authData.user.id,
          email: account.email,
          ...account.data,
        })

        if (profileError) {
          console.error("[DEMO-LOGIN] Error creating demo profile:", {
            error: profileError,
            code: profileError.code,
            message: profileError.message
          })
          throw new Error(`Failed to create demo profile: ${profileError.message}`)
        }
        console.log('[DEMO-LOGIN] Demo profile created successfully');
      } else {
        console.error('[DEMO-LOGIN] No user data returned from auth signup');
        throw new Error('No user data returned from auth signup')
      }
    } else {
      console.log('[DEMO-LOGIN] Demo account exists', {
        userId: existingUser.id
      });
    }

    console.log('[DEMO-LOGIN] Attempting to sign in with demo account...');
    // Sign in with the demo account
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: account.email,
      password: account.password,
    })

    if (signInError) {
      console.error("[DEMO-LOGIN] Error signing in:", {
        error: signInError,
        code: signInError.status,
        message: signInError.message
      })
      throw new Error(`Failed to sign in: ${signInError.message}`)
    }

    console.log('[DEMO-LOGIN] Sign in successful', {
      userId: signInData?.user?.id,
      session: !!signInData?.session
    });

    // Get session to verify it was set properly
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    console.log('[DEMO-LOGIN] Current session state:', {
      hasSession: !!session,
      sessionError: sessionError?.message || null
    });

    // Determine the redirect URL based on user type
    const redirectUrl = `/(protected)/${userType}/dashboard`
    console.log('[DEMO-LOGIN] Redirecting to', { redirectUrl });
    redirect(redirectUrl)
  } catch (error) {
    // Don't treat NEXT_REDIRECT as an error since it's our success path
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error; // Re-throw to let Next.js handle the redirect
    }

    console.error("[DEMO-LOGIN] Fatal error:", {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    throw error;
  }
}


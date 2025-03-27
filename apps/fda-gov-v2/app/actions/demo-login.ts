"use server"

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DEMO_ACCOUNTS, UserType } from '@/lib/constants/demo-accounts'

export async function demoLogin(userType: UserType = "patient") {
  console.log('[DEMO] Starting login process for:', userType)
  const supabase = await createClient()
  const account = DEMO_ACCOUNTS[userType]

  try {
    // Try to sign in first - most common case
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: account.email,
      password: account.password,
    })

    // If sign in worked, update profile and redirect
    if (!signInError && signInData?.user) {
      console.log('[DEMO] Sign in successful, updating profile')
      
      // Update profile with latest demo data
      const { error: updateError } = await supabase
        .from('profiles')
        .update(account.data)
        .eq('id', signInData.user.id)

      if (updateError) {
        console.error('[DEMO] Profile update failed:', updateError.message)
      }

      const redirectUrl = `/${userType}/dashboard`
      console.log('[DEMO] Redirecting to dashboard')
      redirect(redirectUrl)
    }

    // If error is not "Invalid login credentials", something else is wrong
    if (signInError && signInError.message !== 'Invalid login credentials') {
      throw signInError
    }

    // If we get here, user doesn't exist - create them
    console.log('[DEMO] Account not found, creating new account')
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: account.email,
      password: account.password,
      options: {
        data: account.data,
        emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`
      }
    })

    if (signUpError) {
      console.error("[DEMO] Account creation failed:", signUpError.message)
      throw signUpError
    }

    if (!signUpData.user) {
      throw new Error('No user returned from signUp')
    }

    console.log('[DEMO] Account created, attempting final sign in')

    // Try signing in again
    const { error: finalSignInError } = await supabase.auth.signInWithPassword({
      email: account.email,
      password: account.password,
    })

    if (finalSignInError) {
      console.error("[DEMO] Final sign in failed:", finalSignInError.message)
      throw finalSignInError
    }

    const redirectUrl = `/${userType}/dashboard`
    console.log('[DEMO] Redirecting to dashboard')
    redirect(redirectUrl)
  } catch (error) {
    // Don't treat NEXT_REDIRECT as an error since it's our success path
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error
    }

    console.error("[DEMO] Fatal error:", error instanceof Error ? error.message : error)
    throw error
  }
}


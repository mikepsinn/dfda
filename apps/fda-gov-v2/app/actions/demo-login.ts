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
    // Try to sign in first - most common case
    console.log('[DEMO-LOGIN] Attempting to sign in...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: account.email,
      password: account.password,
    })

    // If sign in worked, update profile and redirect
    if (!signInError && signInData?.user) {
      console.log('[DEMO-LOGIN] Sign in successful');
      
      // Update profile with latest demo data
      const { error: updateError } = await supabase
        .from('profiles')
        .update(account.data)
        .eq('id', signInData.user.id)

      if (updateError) {
        console.error('[DEMO-LOGIN] Failed to update profile:', updateError)
      }

      const redirectUrl = `/(protected)/${userType}/dashboard`
      console.log('[DEMO-LOGIN] Redirecting to', { redirectUrl });
      redirect(redirectUrl)
    }

    // If error is not "Invalid login credentials", something else is wrong
    if (signInError && signInError.message !== 'Invalid login credentials') {
      throw signInError
    }

    // If we get here, user doesn't exist - create them
    console.log('[DEMO-LOGIN] Account not found, creating new account...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: account.email,
      password: account.password,
      options: {
        data: account.data, // Store user_type in auth metadata
        emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`
      }
    })

    if (signUpError) {
      console.error("[DEMO-LOGIN] Failed to create account:", signUpError)
      throw signUpError
    }

    if (!signUpData.user) {
      throw new Error('No user returned from signUp')
    }

    console.log('[DEMO-LOGIN] Account created successfully');

    // Profile will be created by the database trigger
    // Try signing in again
    const { error: finalSignInError } = await supabase.auth.signInWithPassword({
      email: account.email,
      password: account.password,
    })

    if (finalSignInError) {
      console.error("[DEMO-LOGIN] Failed to sign in after creation:", finalSignInError)
      throw finalSignInError
    }

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


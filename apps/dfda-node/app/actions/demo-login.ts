"use server"

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DEMO_ACCOUNTS, UserType } from '@/lib/constants/demo-accounts'
import { createLogger } from '@/lib/logger'

const logger = createLogger('demo-login')

export async function demoLogin(userType: UserType = "patient") {
  logger.info('Starting login process', { userType })
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
      logger.info('Sign in successful, updating profile', { userId: signInData.user.id })
      
      // Update profile with latest demo data
      const { error: updateError } = await supabase
        .from('profiles')
        .update(account.data)
        .eq('id', signInData.user.id)

      if (updateError) {
        logger.error('Profile update failed', { error: updateError })
      }

      const redirectUrl = `/${userType}/`
      logger.info('Redirecting to dashboard', { redirectUrl })
      redirect(redirectUrl)
    }

    // If error is not "Invalid login credentials", something else is wrong
    if (signInError && signInError.message !== 'Invalid login credentials') {
      throw signInError
    }

    // If we get here, user doesn't exist - create them
    logger.info('Account not found, creating new account', { email: account.email })
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: account.email,
      password: account.password,
      options: {
        data: account.data,
        emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`
      }
    })

    if (signUpError) {
      logger.error('Account creation failed', { error: signUpError })
      throw signUpError
    }

    if (!signUpData.user) {
      throw new Error('No user returned from signUp')
    }

    logger.info('Account created, attempting final sign in')

    // Try signing in again
    const { error: finalSignInError } = await supabase.auth.signInWithPassword({
      email: account.email,
      password: account.password,
    })

    if (finalSignInError) {
      logger.error('Final sign in failed', { error: finalSignInError })
      throw finalSignInError
    }

    const redirectUrl = `/${userType}/`
    logger.info('Redirecting to dashboard', { redirectUrl })
    redirect(redirectUrl)
  } catch (error) {
    // Don't treat NEXT_REDIRECT as an error since it's our success path
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error
    }

    logger.error('Fatal error in demo login', { 
      error: error instanceof Error ? error.message : error,
      userType 
    })
    throw error
  }
}


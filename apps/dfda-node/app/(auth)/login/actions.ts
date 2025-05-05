'use server'

import { createClient } from '@/utils/supabase/server'
import { getCallbackUrl } from '@/lib/url'
import { logger } from '@/lib/logger'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export async function loginWithOtp(formData: FormData) {
  const email = formData.get('email') as string;
  const supabase = await createClient()

  if (!email) {
    logger.warn('[Action - loginWithOtp] Email is missing');
    return redirect('/login?error=Email is required');
  }

  // Include origin in redirect URL for OTP confirmation
  const headersList = await headers()
  const origin = headersList.get('origin')!
  const emailRedirectTo = getCallbackUrl(origin)

  logger.info('[Action - loginWithOtp] Attempting OTP sign in', { email, emailRedirectTo });

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // shouldCreateUser: false, // Keep default (true) to allow sign-in or sign-up
      emailRedirectTo,
    },
  })

  if (error) {
    logger.error('[Action - loginWithOtp] OTP Sign in failed', { error: error.message });
    // Redirect back to login page with a generic error message
    return redirect('/login?error=Could not authenticate user. Please try again.');
  }

  // Redirect to a page indicating that the email has been sent
  return redirect('/login?message=Check email to continue sign in process');
}

export async function loginWithGoogle() {
  const supabase = await createClient()
  const redirectTo = getCallbackUrl() // Use the function directly

  logger.info('[Action - loginWithGoogle] Attempting Google OAuth', { redirectTo });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo, // Pass the correctly formed URL
    },
  });

  if (error) {
    logger.error('[Action - loginWithGoogle] Google OAuth initiation failed', { error: error.message });
    return redirect('/login?error=Could not authenticate with Google. Please try again.');
  }

  if (data.url) {
    logger.info('[Action - loginWithGoogle] Redirecting to Google URL');
    return redirect(data.url);
  }

  // Fallback case
  logger.error('[Action - loginWithGoogle] No URL returned from signInWithOAuth without error');
  return redirect('/login?error=An unexpected error occurred during Google sign in.');
} 
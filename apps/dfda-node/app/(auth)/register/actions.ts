'use server'

import { createClient } from '@/utils/supabase/server'
import { getCallbackUrl } from '@/lib/url'
import { logger } from '@/lib/logger'
import { redirect } from 'next/navigation'

export async function registerWithOtp(formData: FormData) {
  const email = formData.get('email') as string;
  const supabase = await createClient()

  if (!email) {
    logger.warn('[Action - registerWithOtp] Email is missing');
    return redirect('/register?error=Email is required');
  }

  const emailRedirectTo = getCallbackUrl() // getCallbackUrl now provides the full, correct URL

  logger.info('[Action - registerWithOtp] Attempting OTP sign up/in', { email, emailRedirectTo });

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true, // Explicitly allow user creation
      emailRedirectTo,
    },
  })

  if (error) {
    logger.error('[Action - registerWithOtp] OTP Sign up/in failed', { error: error.message });
    return redirect('/register?error=Could not register user. Please try again.');
  }

  // Redirect to a page indicating that the email has been sent
  return redirect('/register?message=Check email to continue sign up process');
}

export async function registerWithGoogle() {
  const supabase = await createClient()
  const redirectTo = getCallbackUrl() // Use the function directly

  logger.info('[Action - registerWithGoogle] Attempting Google OAuth', { redirectTo });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo, // Pass the correctly formed URL
    },
  });

  if (error) {
    logger.error('[Action - registerWithGoogle] Google OAuth initiation failed', { error: error.message });
    return redirect('/register?error=Could not authenticate with Google. Please try again.');
  }

  if (data.url) {
    logger.info('[Action - registerWithGoogle] Redirecting to Google URL');
    return redirect(data.url);
  }

  // Fallback case
  logger.error('[Action - registerWithGoogle] No URL returned from signInWithOAuth without error');
  return redirect('/register?error=An unexpected error occurred during Google sign in.');
} 
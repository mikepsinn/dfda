'use server'

import { createClient } from '@/utils/supabase/server'
import { getCallbackUrl } from '@/lib/url'
import { logger } from '@/lib/logger'
import { redirect } from 'next/navigation'

export async function requestPasswordReset(formData: FormData) {
  const email = formData.get('email') as string;
  const supabase = await createClient()

  if (!email) {
    logger.warn('[Action - requestPasswordReset] Email is missing');
    // No need for return here, redirect exits
    redirect('/forgot-password?error=Email is required');
  }

  // Construct the full URL for the update password page
  const redirectTo = getCallbackUrl('/update-password');

  logger.info('[Action - requestPasswordReset] Attempting password reset request', { email, redirectTo });

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    logger.error('[Action - requestPasswordReset] Password reset request failed', { error: error.message });
    // Redirect back to forgot password page with a generic error message
    redirect('/forgot-password?error=Could not send reset link. Please try again.');
  }

  // Redirect to indicate that the email has been sent
  redirect('/forgot-password?message=Check email to continue reset process');
} 
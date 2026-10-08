'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { logger } from '@/lib/logger'

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();

  if (!email) {
    logger.warn('[Action - requestPasswordReset] Email is missing');
    redirect('/forgot-password?error=Email is required');
  }

  try {
    // The reset link opens /update-password?token=... The response is the same
    // whether or not the account exists.
    await auth.api.requestPasswordReset({
      body: { email, redirectTo: '/update-password' },
      headers: await headers(),
    });
  } catch (error) {
    logger.error('[Action - requestPasswordReset] Password reset request failed', {
      error: error instanceof Error ? error.message : error,
    });
    redirect('/forgot-password?error=Could not send reset link. Please try again.');
  }

  redirect('/forgot-password?message=Check email to continue reset process');
}

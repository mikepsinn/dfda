'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { logger } from '@/lib/logger'

// Define a schema for password validation
const passwordSchema = z.string().min(8, 'Password must be at least 8 characters long');

function retry(token: string, message: string): never {
  const query = new URLSearchParams({ token, error: message });
  redirect(`/update-password?${query.toString()}`);
}

export async function updatePassword(formData: FormData) {
  const token = String(formData.get('token') ?? '');
  const password = String(formData.get('password') ?? '');
  const confirmPassword = String(formData.get('confirmPassword') ?? '');

  if (!token) {
    redirect('/forgot-password?error=The reset link is not valid. Please ask for a new one.');
  }

  // Basic server-side validation
  if (password !== confirmPassword) {
    logger.warn('[Action - updatePassword] Passwords do not match');
    retry(token, 'Passwords do not match');
  }

  // Zod validation for password complexity (minimum length)
  const validationResult = passwordSchema.safeParse(password);
  if (!validationResult.success) {
    const errorMessage = validationResult.error.errors[0]?.message || 'Password does not meet requirements';
    logger.warn('[Action - updatePassword] Password validation failed', { error: errorMessage });
    retry(token, errorMessage);
  }

  try {
    // Also creates the password for an account that had none (magic link or
    // Google), and signs out the account's other sessions.
    await auth.api.resetPassword({ body: { newPassword: password, token }, headers: await headers() });
  } catch (error) {
    logger.error('[Action - updatePassword] Password update failed', {
      error: error instanceof Error ? error.message : error,
    });
    redirect('/forgot-password?error=The reset link is not valid or has expired. Please ask for a new one.');
  }

  logger.info('[Action - updatePassword] Password updated successfully');
  redirect('/login?notice=Your password is updated. Sign in with your new password.');
}

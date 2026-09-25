'use server'

import { createClient } from '@/utils/supabase/server'
import { logger } from '@/lib/logger'
import { redirect } from 'next/navigation'
import { z } from 'zod'

// Define a schema for password validation
const passwordSchema = z.string().min(8, 'Password must be at least 8 characters long');

export async function updatePassword(formData: FormData) {
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;
  const supabase = await createClient()

  // Basic server-side validation
  if (password !== confirmPassword) {
    logger.warn('[Action - updatePassword] Passwords do not match');
    redirect('/update-password?error=Passwords do not match');
  }

  // Zod validation for password complexity (minimum length)
  const validationResult = passwordSchema.safeParse(password);
  if (!validationResult.success) {
    const errorMessage = validationResult.error.errors[0]?.message || 'Password does not meet requirements';
    logger.warn('[Action - updatePassword] Password validation failed', { error: errorMessage });
    redirect(`/update-password?error=${encodeURIComponent(errorMessage)}`);
  }

  logger.info('[Action - updatePassword] Attempting password update');

  const { error } = await supabase.auth.updateUser({ 
    password: password 
  });

  if (error) {
    logger.error('[Action - updatePassword] Password update failed', { error: error.message });
    let friendlyError = 'Could not update password. Please try again.';
    // Provide more specific feedback if possible (e.g., weak password)
    if (error.message.toLowerCase().includes('weak password')) {
      friendlyError = 'Password is too weak. Please choose a stronger password.';
    }
    redirect(`/update-password?error=${encodeURIComponent(friendlyError)}`);
  }

  logger.info('[Action - updatePassword] Password updated successfully, redirecting to home');
  // Redirect to the home page or dashboard upon successful update
  redirect('/');
} 
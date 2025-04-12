"use server"

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DEMO_ACCOUNTS, DemoUserType } from '@/lib/constants/demo-accounts'
import { createLogger } from '@/lib/logger'
import { AuthApiError } from '@supabase/supabase-js'
import { setupDemoUserData } from './seed-demo-data' // Import the new seeding function

const logger = createLogger('demo-login')

// Helper function to upsert profile data (now simpler, only profile fields)
async function upsertProfile(userId: string, userType: DemoUserType) {
  const supabase = await createClient()
  const account = DEMO_ACCOUNTS[userType]
  logger.info('Upserting profile data', { userId, userType })
  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: userId, 
      email: account.email, // Ensure email is consistent
      ...account.profileData, // Use profileData from constants
    })

  if (error) {
    logger.error('Profile upsert failed', { userId, error })
    // Don't throw here, let the main seeding handle potential issues
  }
}

// Updated demoLogin: Calls setupDemoUserData after successful auth
export async function demoLogin(userType: DemoUserType = "patient") {
  logger.info('Starting login process', { userType })
  const supabase = await createClient()
  const account = DEMO_ACCOUNTS[userType]
  const redirectUrl = `/${userType}/`

  try {
    let userId: string | undefined = undefined;
    let requiresSeeding = false; // Flag to indicate if seeding should run

    // 1. Attempt Sign In
    logger.info('Attempting sign in', { email: account.email });
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: account.email,
      password: account.password,
    })

    // 2. If Sign In OK
    if (!signInError && signInData?.user) {
      logger.info('Sign in successful', { userId: signInData.user.id })
      userId = signInData.user.id;
      // Run seeding after successful sign-in to ensure data consistency
      requiresSeeding = true; 
    }
    // 3. If Sign In Fails - Attempt Sign Up
    else {
        if (signInError) {
            logger.warn('Sign in failed, proceeding to sign up attempt', { 
                email: account.email,
                error: signInError?.message 
            });
        } else {
            logger.warn('Sign in did not return user, proceeding to sign up attempt', { email: account.email });
        }
        
        try {
            // 3a. Attempt Sign Up 
            logger.info('Attempting sign up', { email: account.email });
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
              email: account.email,
              password: account.password, 
            })

            // 3b. If Sign Up OK
            if (!signUpError && signUpData?.user) {
                logger.info('Sign up successful', { userId: signUpData.user.id });
                userId = signUpData.user.id;
                requiresSeeding = true; // New user, definitely requires seeding
                // Need to sign in again to establish session
                const { error: postSignUpError } = await supabase.auth.signInWithPassword({ email: account.email, password: account.password });
                if (postSignUpError) throw postSignUpError;
                logger.info('Post-signup sign in successful');
            }
            // 3c. If Sign Up Fails (User Exists?)
            else if (signUpError instanceof AuthApiError && signUpError.status === 422) {
                logger.warn('Sign up failed: User already exists', { email: account.email });
                userId = account.id; // Use the known ID
                requiresSeeding = true; // User exists, run seeding to ensure data consistency
                // Attempt sign in again, as the password might now be set
                logger.info('Attempting sign in again after user existed confirmation', { userId });
                const { error: finalSignInError } = await supabase.auth.signInWithPassword({ email: account.email, password: account.password });
                if (finalSignInError) {
                     logger.error('Final sign in attempt failed after confirming user exists', { email: account.email, error: finalSignInError });
                     throw new Error(`Could not sign in demo user ${userType}. Check password or logs.`);
                }
                logger.info('Final sign in successful');
            }
            // 3d. If Sign Up Fails (Other Error)
            else if (signUpError) {
                 logger.error('Sign up failed with unexpected error', { email: account.email, error: signUpError });
                 throw new Error(`Could not create or verify demo user ${userType}. Check Supabase logs.`);
            }
            // 3e. If Sign Up returns no error but no user (should not happen)
            else if (!userId) {
                logger.error('Sign up completed without error but no user ID obtained.', { email: account.email });
                throw new Error(`Demo user setup failed for ${userType}.`);
            }

        } catch (error) {
            throw error; // Re-throw errors from sign-up block
        }
    }

    // 4. If we have a userId and need seeding, run it
    if (userId && requiresSeeding) {
        logger.info('Proceeding to setup demo user data', { userId });
        await upsertProfile(userId, userType); // Ensure profile base data is set first
        await setupDemoUserData(userId, userType); // Run the detailed seeding
    } else if (!userId) {
        // This state should not be reachable if logic above is correct
        logger.error('Demo login flow completed without obtaining a user ID.');
        throw new Error(`Could not log in or set up demo user ${userType}.`);
    }

    // 5. Redirect
    logger.info('Redirecting to dashboard', { redirectUrl, userId });
    redirect(redirectUrl);

  } catch (error) {
    // Handle potential redirect errors
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error
    }
    
    // Log and re-throw any other fatal errors
    logger.error('Fatal error during demo login process', { 
      error: error instanceof Error ? error.message : String(error),
      userType 
    })
    throw error; // Re-throw the original error for the UI
  }
}


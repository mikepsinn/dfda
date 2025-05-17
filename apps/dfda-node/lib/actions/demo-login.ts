"use server"

import { createClient as createServerClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/utils/supabase/admin'
import { DEMO_ACCOUNTS, DemoUserType } from '@/lib/constants/demo-accounts'
import { createLogger } from '@/lib/logger'
import { AuthApiError, type User } from '@supabase/supabase-js'
import { setupDemoUserData } from './seed-demo-data' // Keep this
import type { ProfileInsert } from "@/lib/profile"; // Keep only ProfileInsert
import { getCallbackUrl } from '@/lib/url'; 

const logger = createLogger('demo-login')

// Removed the upsertProfile helper function as we'll handle it directly
// async function upsertProfile(...) { ... }

// Action now returns a success status and redirect URL
export async function demoLogin(userType: DemoUserType = "patient"): Promise<{ success: boolean; error?: string; redirectUrl?: string }> {
  logger.info('Starting login process', { userType })
  const supabaseUserClient = await createServerClient() 
  const account = DEMO_ACCOUNTS[userType]
  const redirectUrl = `/${userType}/`

  try {
    let user: User | null = null; 
    let userId: string | undefined = undefined;
    let requiresSeeding = false; 

    // 1. Attempt Sign In
    logger.info('Attempting sign in', { email: account.email });
    const { data: signInData, error: signInError } = await supabaseUserClient.auth.signInWithPassword({
      email: account.email,
      password: account.password,
    })

    if (!signInError && signInData?.user) {
      logger.info('Sign in successful', { userId: signInData.user.id })
      user = signInData.user;
      userId = user.id;
      requiresSeeding = true; 
    }
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
            const { data: signUpData, error: signUpError } = await supabaseUserClient.auth.signUp({
              email: account.email,
              password: account.password, 
              options: {
                data: { auto_confirm: true }, 
                emailRedirectTo: getCallbackUrl() 
              }
            })

            if (!signUpError && signUpData?.user) {
                logger.info('Sign up successful', { userId: signUpData.user.id });
                user = signUpData.user;
                userId = user.id;
                requiresSeeding = true; 
            }
            else if (signUpError instanceof AuthApiError && signUpError.status === 422) {
                logger.warn('Sign up failed: User already exists', { email: account.email });
                requiresSeeding = true; // User exists, run seeding to ensure data consistency
                logger.info('Attempting sign in again after user existed confirmation', { email: account.email }); 
                const { data: finalSignInData, error: finalSignInError } = await supabaseUserClient.auth.signInWithPassword({ email: account.email, password: account.password });
                if (finalSignInError) {
                     if (finalSignInError.message.includes('Email not confirmed')) {
                         logger.error('Final sign in failed: Email not confirmed for existing user.', { email: account.email });
                         throw new Error(`Demo user ${userType} exists but email is not confirmed. Please confirm manually in Supabase or check settings.`);
                     }
                     logger.error('Final sign in attempt failed after confirming user exists', { email: account.email, error: finalSignInError });
                     throw new Error(`Could not sign in demo user ${userType}. Check password or logs.`);
                }
                if (!finalSignInData?.user) throw new Error("Final sign in attempt failed to return user data.");
                user = finalSignInData.user; 
                userId = user.id;
                logger.info('Final sign in successful');
            }
            else if (signUpError) {
                 logger.error('Sign up failed with unexpected error', { email: account.email, error: signUpError });
                 throw new Error(`Could not create or verify demo user ${userType}. Check Supabase logs.`);
            }
            else if (!userId) {
                logger.error('Sign up completed without error but no user ID obtained.', { email: account.email });
                throw new Error(`Demo user setup failed for ${userType}.`);
            }

        } catch (error) {
            throw error; 
        }
    }

    // 4. If we have a userId and user, upsert profile and seed data using ADMIN client
    if (userId && user && requiresSeeding) { 
        logger.info('Proceeding to setup demo user data using ADMIN client', { userId });
        
        // --- Direct Profile Upsert using ADMIN client --- 
        const profileData: ProfileInsert = {
            id: userId,
            email: account.email, 
            ...account.profileData, 
        };

        try {
            // Use supabaseAdmin here
            const { error: profileUpsertError } = await supabaseAdmin
                .from('profiles')
                .upsert(profileData) 
                .select('id') 
                .single();

            if (profileUpsertError) {
                logger.error('Direct profile upsert failed using ADMIN client', { userId, error: profileUpsertError });
            } else {
                logger.info('Direct profile upsert successful using ADMIN client', { userId });
            }
        } catch (upsertErr) {
             logger.error('Unexpected error during direct profile upsert with ADMIN client', { userId, error: upsertErr });
        }
        // --- End Direct Profile Upsert ---

        // --- Seeding using ADMIN client --- 
        // logger.warn('SKIPPING data seeding for debugging purposes.'); // Remove or keep commented
        await setupDemoUserData(supabaseAdmin, userId, userType); 
        // --- End Seeding ---

    } else if (!userId || !user) {
        // This state should not be reachable if logic above is correct
        logger.error('Demo login flow completed without obtaining a user ID or user object.');
        return { success: false, error: `Could not log in or set up demo user ${userType}.` };
    }

    // 5. Return success instead of redirecting
    logger.info('Demo login action successful, returning success status', { userId, redirectUrl });
    return { success: true, redirectUrl: redirectUrl };

  } catch (error: any) {
    logger.error('Fatal error during demo login process', { 
      error: error instanceof Error ? error.message : String(error),
      userType 
    })
    // Return error status
    return { success: false, error: error.message || "An unexpected error occurred during demo login." }; 
  }
}


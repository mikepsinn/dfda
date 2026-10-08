"use server"

import { headers } from 'next/headers'
import { APIError } from 'better-auth/api'
import { auth } from '@/lib/auth'
import { ensurePasswordUser } from '@/lib/auth-users'
import { adminDb } from '@/lib/db'
import { DEMO_ACCOUNTS, DemoUserType } from '@/lib/constants/demo-accounts'
import { createLogger } from '@/lib/logger'
import { setupDemoUserData } from './seed-demo-data'
import type { ProfileInsert } from "@/lib/profile";

const logger = createLogger('demo-login')

// Signs in to a demo account, creating it on first use, and resets its demo
// data. Returns the page to open instead of redirecting.
export async function demoLogin(userType: DemoUserType = "patient"): Promise<{ success: boolean; error?: string; redirectUrl?: string }> {
  logger.info('Starting login process', { userType })
  const account = DEMO_ACCOUNTS[userType]
  const redirectUrl = `/${userType}/`

  try {
    // 1. Make sure the account exists and has the demo password.
    const name = `${account.profileData.first_name ?? 'Demo'} ${account.profileData.last_name ?? userType}`
    const userId = await ensurePasswordUser(account.email, name, account.password)

    // 2. Sign in. The session cookie is set on the response (nextCookies).
    try {
      await auth.api.signInEmail({
        body: { email: account.email, password: account.password },
        headers: await headers(),
      })
    } catch (error) {
      if (error instanceof APIError) {
        logger.error('Demo sign in failed', { email: account.email, status: error.status })
        throw new Error(`Could not sign in demo user ${userType}. The account may have a different password.`)
      }
      throw error
    }

    // 3. Set the demo profile and data (full access: the user is authorized above).
    const profileData = {
      id: userId,
      email: account.email,
      ...account.profileData,
    } satisfies ProfileInsert;

    await adminDb.profiles.upsert({
      where: { id: userId },
      create: profileData,
      update: profileData,
      select: { id: true },
    });
    await setupDemoUserData(adminDb, userId, userType);

    // 4. Return success instead of redirecting
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


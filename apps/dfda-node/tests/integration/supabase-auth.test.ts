import { createClient } from '@supabase/supabase-js'
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { DEMO_ACCOUNTS, UserType } from '@/lib/constants/demo-accounts'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const userTypes: UserType[] = ['patient', 'provider', 'research-partner']

describe('Supabase Authentication & Account Management', () => {
  // Clean up before and after all tests
  beforeAll(async () => {
    await deleteAllDemoAccounts()
  })

  afterAll(async () => {
    await deleteAllDemoAccounts()
    await supabase.auth.signOut()
  })

  // Helper function to delete all demo accounts
  async function deleteAllDemoAccounts() {
    for (const userType of userTypes) {
      const account = DEMO_ACCOUNTS[userType]
      console.log(`[DELETE] Attempting to delete ${userType} account:`, account.email)

      // Delete the profile first
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('email', account.email)

      if (profileError && !profileError.message.includes('no rows')) {
        console.log(`[DELETE] Profile deletion error for ${userType}:`, profileError.message)
      } else {
        console.log(`[DELETE] Profile deletion for ${userType}: Success`)
      }

      // Try to sign out just in case
      await supabase.auth.signOut()
    }
  }

  it('should register new users and create their profiles', async () => {
    for (const userType of userTypes) {
      const account = DEMO_ACCOUNTS[userType]
      console.log(`[CREATE] Creating ${userType} account:`, account.email)

      // Create the auth account
      let { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: account.email,
        password: account.password,
      })

      // If account already exists, try to sign in instead
      if (signUpError?.message.includes('already registered')) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: account.email,
          password: account.password,
        })
        
        expect(signInError).toBeNull()
        expect(signInData.user).toBeTruthy()
        
        authData = signInData
      } else {
        expect(signUpError).toBeNull()
        expect(authData.user).toBeTruthy()
      }

      // Create or update the profile
      if (authData?.user) {
        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            email: account.email,
            ...account.data,
          })
          .select()
          .single()

        expect(upsertError).toBeNull()
      }

      // Sign out after each creation
      await supabase.auth.signOut()
    }
  })

  it('should authenticate users and retrieve their profiles', async () => {
    for (const userType of userTypes) {
      const account = DEMO_ACCOUNTS[userType]
      console.log(`[VERIFY] Testing ${userType} account:`, account.email)

      // Try to sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email: account.email,
        password: account.password,
      })

      expect(error).toBeNull()
      expect(data.user).toBeTruthy()
      expect(data.user?.email).toBe(account.email)

      // Verify profile exists and matches
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user?.id)
        .single()

      expect(profileError).toBeNull()
      expect(profile).toBeTruthy()
      expect(profile.email).toBe(account.email)
      expect(profile.user_type).toBe(account.data.user_type)

      // Sign out after verification
      await supabase.auth.signOut()
    }
  })

  it('should prevent duplicate registrations', async () => {
    const { email, password } = DEMO_ACCOUNTS.patient

    // Attempt to create duplicate account
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })

    expect(signUpError?.message).toContain('already registered')
  })
}) 
import { createClient } from '@supabase/supabase-js'
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { DEMO_ACCOUNTS, UserType } from '@/lib/constants/demo-accounts'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const userTypes: UserType[] = ['patient', 'doctor', 'sponsor']

describe('Demo Accounts Management', () => {
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

      // First try to sign in to see if account exists
      const { data } = await supabase.auth.signInWithPassword({
        email: account.email,
        password: account.password,
      })

      if (data.user) {
        // Delete the profile first
        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', data.user.id)

        console.log(`[DELETE] Profile deletion for ${userType}:`, 
          profileError ? `Error: ${profileError.message}` : 'Success')

        // Then delete the user
        const { error: userError } = await supabase.auth.admin.deleteUser(
          data.user.id
        )

        console.log(`[DELETE] User deletion for ${userType}:`,
          userError ? `Error: ${userError.message}` : 'Success')
      } else {
        console.log(`[DELETE] ${userType} account doesn't exist, skipping`)
      }

      // Sign out just in case
      await supabase.auth.signOut()
    }
  }

  it('should create all demo accounts successfully', async () => {
    for (const userType of userTypes) {
      const account = DEMO_ACCOUNTS[userType]
      console.log(`[CREATE] Creating ${userType} account:`, account.email)

      // Create the auth account
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: account.email,
        password: account.password,
      })

      expect(signUpError).toBeNull()
      expect(authData.user).toBeTruthy()

      // Create the profile
      if (authData?.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: account.email,
            ...account.data,
          })
          .select()
          .single()

        expect(profileError).toBeNull()
      }

      // Sign out after each creation
      await supabase.auth.signOut()
    }
  })

  it('should verify all demo accounts can sign in and have correct profiles', async () => {
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

  it('should prevent duplicate demo account creation', async () => {
    const { email, password } = DEMO_ACCOUNTS.patient

    // Attempt to create duplicate account
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })

    expect(signUpError?.message).toContain('already registered')
  })
}) 
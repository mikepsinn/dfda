import { createClient } from '@supabase/supabase-js'
import { describe, it, expect, beforeAll } from '@jest/globals'
import dotenv from 'dotenv'
import { DEMO_ACCOUNTS, UserType } from '@/lib/constants/demo-accounts'

dotenv.config({ path: '.env.test' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const userTypes: UserType[] = ['patient', 'doctor', 'sponsor']

describe('Demo Accounts Management', () => {
  describe('deleteAccounts', () => {
    it('should delete all demo accounts if they exist', async () => {
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
    })
  })

  describe('createAccounts', () => {
    it('should create all demo accounts', async () => {
      for (const userType of userTypes) {
        const account = DEMO_ACCOUNTS[userType]
        console.log(`[CREATE] Creating ${userType} account:`, account.email)

        // Create the auth account
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: account.email,
          password: account.password,
        })

        if (signUpError && !signUpError.message.includes('already registered')) {
          throw signUpError
        }

        console.log(`[CREATE] Auth signup for ${userType}:`,
          signUpError ? `Already exists` : 'Success')

        // Create the profile if we got a user back
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

          console.log(`[CREATE] Profile creation for ${userType}:`,
            profileError ? `Error: ${profileError.message}` : 'Success')
        }

        // Sign out after each creation
        await supabase.auth.signOut()
      }
    })
  })

  describe('verifyAccounts', () => {
    it('should verify all demo accounts can sign in', async () => {
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
  })
}) 
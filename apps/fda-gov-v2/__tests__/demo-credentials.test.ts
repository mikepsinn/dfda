import { createClient } from '@supabase/supabase-js'
import { describe, it, expect, beforeAll } from '@jest/globals'
import dotenv from 'dotenv'
import { DEMO_ACCOUNTS } from '@/lib/constants/demo-accounts'

dotenv.config({ path: '.env.test' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

describe('Demo Account Credentials', () => {
  beforeAll(async () => {
    const { email, password } = DEMO_ACCOUNTS.patient
    
    // Try to sign up the demo account first
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })

    // Ignore error if account already exists
    if (signUpError && !signUpError.message.includes('already registered')) {
      throw signUpError
    }
  })

  it('should be able to sign in with demo patient account', async () => {
    const { email, password } = DEMO_ACCOUNTS.patient

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    console.log('Sign in attempt result:', { data, error })
    
    expect(error).toBeNull()
    expect(data.user).toBeTruthy()
    expect(data.user?.email).toBe(email)
  })

  afterAll(async () => {
    await supabase.auth.signOut()
  })
}) 
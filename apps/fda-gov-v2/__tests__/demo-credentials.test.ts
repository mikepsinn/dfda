import { createClient } from '@supabase/supabase-js'
import { describe, it, expect } from '@jest/globals'
import dotenv from 'dotenv'
import { DEMO_ACCOUNTS } from '@/lib/constants/demo-accounts'

dotenv.config({ path: '.env.test' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

describe('Demo Account Credentials', () => {
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
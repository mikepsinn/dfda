"use client"

import { createClient } from '@/utils/supabase/client'
import { getCallbackUrl } from '@/lib/url'
import { logger } from '@/lib/logger'

export async function getUser() {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

export async function signOut() {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function signInWithEmail(email: string, password: string) {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export async function signInWithOtp(email: string) {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: getCallbackUrl(),
    }
  })
  return { data, error }
}

export async function signInWithGoogle() {
  const supabase = createClient()
  const redirectTo = getCallbackUrl()
  logger.info('[signInWithGoogle] Attempting Google OAuth', { redirectTo })
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectTo,
    },
  })
  return { data, error }
}

export async function getCurrentUser() {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}


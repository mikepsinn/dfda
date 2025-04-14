import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import type { User } from '@supabase/supabase-js'
import { AuthSessionMissingError } from '@supabase/supabase-js'

export async function getServerUser(): Promise<User | null> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError && !(authError instanceof AuthSessionMissingError)) {
    logger.error("Error getting auth user:", { authError })
  }
  if (authError || !user) {
    return null
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('user_type')
    .eq('id', user.id)
    .single()

  if (profileError) {
    logger.error("Error getting user profile:", { userId: user.id, profileError })
  }

  if (!user.user_metadata) {
    user.user_metadata = {}
  }

  if (profile?.user_type) {
    user.user_metadata.user_type = profile.user_type
  } else if (!profileError) {
    logger.warn('User profile found, but user_type is missing.', { userId: user.id })
  }

  logger.debug('getServerUser returning user with metadata:', user)
  return user
}

export async function getServerSession() {
  const supabase = await createClient()
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) {
    logger.error("Error getting session:", { error })
    return null
  }
  return session
}


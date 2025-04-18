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

  logger.debug('getServerUser returning raw user object', { userId: user.id, metadata: user.user_metadata })
  return user // Return the user object without merged profile data
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


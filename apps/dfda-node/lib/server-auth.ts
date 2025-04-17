import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import type { User } from '@supabase/supabase-js'
import { AuthSessionMissingError } from '@supabase/supabase-js'
import { getUserProfile } from "@/lib/profile"

export async function getServerUser(): Promise<User | null> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError && !(authError instanceof AuthSessionMissingError)) {
    logger.error("Error getting auth user:", { authError })
  }
  if (authError || !user) {
    return null
  }

  // We fetch the profile here, but we will no longer merge user_type into metadata.
  // The profile object itself should be used where needed.
  // const profile = await getUserProfile(user); 

  // REMOVED Metadata merging logic:
  // if (!user.user_metadata) {
  //   user.user_metadata = {}
  // }
  //
  // if (profile?.user_type) {
  //   user.user_metadata.user_type = profile.user_type
  // } else {
  //   if (profile) {
  //     logger.warn('getServerUser: User profile found, but user_type is missing.', { userId: user.id })
  //   } else {
  //     logger.warn('getServerUser: User profile not found or failed to fetch.', { userId: user.id })
  //   }
  //   delete user.user_metadata.user_type;
  // }

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


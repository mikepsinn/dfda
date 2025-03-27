import { createClient } from '@/lib/supabase/server'

export async function getServerUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) {
    console.error("Error getting user:", error)
    return null
  }
  return user
}

export async function getServerSession() {
  const supabase = await createClient()
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) {
    console.error("Error getting session:", error)
    return null
  }
  return session
}


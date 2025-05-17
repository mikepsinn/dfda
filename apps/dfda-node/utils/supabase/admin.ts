import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

// Ensure your environment variables are correctly named and loaded
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}

if (!supabaseServiceRoleKey) {
  throw new Error('Missing env.SUPABASE_SERVICE_ROLE_KEY')
}

// Note: this client bypasses RLS.
// Use it ONLY for server-side operations where RLS needs to be bypassed.
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
) 
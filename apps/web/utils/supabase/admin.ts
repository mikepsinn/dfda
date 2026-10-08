import { createClient } from '@supabase/supabase-js'

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
// Use it only for Supabase Auth admin calls and Storage. Table queries use
// Prisma: adminDb from '@/lib/db' (no RLS) or getUserDb() from '@/lib/db/server'.
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
) 
import { createBrowserClient as createBrowserClientSSR } from '@supabase/ssr'
import type { Database } from '@/lib/database.types'

export const createClient = () => {
  return createBrowserClientSSR<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export const createBrowserClient = createClient

import { createClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"

// For server components
export function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

  return createClient<Database>(supabaseUrl, supabaseKey, {
    global: {
      fetch: fetch.bind(globalThis)
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  })
}

// Alias for backward compatibility
export const createServerSupabaseClient = createServerClient

// For client components (singleton pattern)
let clientInstance: ReturnType<typeof createClient<Database>> | null = null

export function createBrowserClient() {
  if (clientInstance) return clientInstance

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

  clientInstance = createClient<Database>(supabaseUrl, supabaseKey)
  return clientInstance
}

// Alias for backward compatibility
export const createClientSupabaseClient = createBrowserClient

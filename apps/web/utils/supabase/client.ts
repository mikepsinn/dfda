import { createBrowserClient as createBrowserClientSSR } from '@supabase/ssr'

export const createClient = () => {
  return createBrowserClientSSR(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export const createBrowserClient = createClient

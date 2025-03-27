import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const cookieStore = await cookies()
          return cookieStore.get(name)?.value
        },
        async set(name: string, value: string, options: CookieOptions) {
          const cookieStore = await cookies()
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // This can happen if the cookie is set in a Server Component
            // We can safely ignore this error since cookies will be handled by middleware
          }
        },
        async remove(name: string, options: CookieOptions) {
          const cookieStore = await cookies()
          try {
            cookieStore.delete({ name, ...options })
          } catch (error) {
            // This can happen if the cookie is removed in a Server Component
            // We can safely ignore this error since cookies will be handled by middleware
          }
        },
      },
    }
  )
} 
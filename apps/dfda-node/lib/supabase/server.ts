import { createServerClient as createServerClientSSR } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/lib/database.types'

export const createClient = async () => {
  const cookieStore = await cookies()

  return createServerClientSSR<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: { path?: string }) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error: any) {
            console.error(`Error setting cookie '${name}':`, error);
            console.error('Set Cookie Stack Trace:');
            console.trace(); // Log stack trace
          }
        },
        remove(name: string, options: { path?: string }) {
          try {
            // Attempt to remove cookie by setting maxAge to 0
            cookieStore.set({ name, value: '', ...options, maxAge: 0 })
          } catch (error: any) {
            // Log error and stack trace if cookie removal fails
            console.error(`Error removing cookie '${name}':`, error);
            console.error('Remove Cookie Stack Trace:');
            console.trace(); // Log stack trace 
            // Re-throw the error to keep the original behavior if needed, 
            // but logging might be sufficient for debugging.
            // throw error;
          }
        },
      },
    }
  )
} 

export const createServerClient = createClient
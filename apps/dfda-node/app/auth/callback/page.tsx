'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client' // Use client Supabase
import { logger } from '@/lib/logger'
import { toast } from '@/components/ui/use-toast' // Assuming you use shadcn toast

// Simple loading component
function LoadingSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      <p className="ml-3 text-muted-foreground">Verifying authentication...</p>
    </div>
  )
}

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    // --- 1. Check for errors in URL fragment --- 
    const hashParams = new URLSearchParams(window.location.hash.slice(1))
    const error = hashParams.get('error')
    const errorCode = hashParams.get('error_code')
    const errorDescription = hashParams.get('error_description')

    if (error || errorCode) {
      logger.error('[AUTH-CALLBACK-PAGE] Error received in URL fragment:', { error, errorCode, errorDescription });
      toast({
        title: "Authentication Error",
        description: errorDescription || error || "An unexpected error occurred during authentication.",
        variant: "destructive",
      });
      // Redirect to login or an error page after showing the toast
      router.replace('/login'); // Use replace to avoid history entry
      return; // Stop processing
    }

    // --- 2. Check for code in query parameters --- 
    const code = searchParams.get('code')
    if (code) {
      logger.info('[AUTH-CALLBACK-PAGE] Code found, exchanging for session...');
      const exchangeCode = async () => {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        if (exchangeError) {
          logger.error('[AUTH-CALLBACK-PAGE] Failed to exchange code for session:', { 
            error: exchangeError.message,
            status: (exchangeError as any).status // Type assertion if needed 
          });
          toast({
            title: "Authentication Failed",
            description: "Could not sign you in. Please try logging in again.",
            variant: "destructive",
          });
          router.replace('/login');
        } else {
          logger.info('[AUTH-CALLBACK-PAGE] Successfully exchanged code, redirecting...');
          // Redirect to intended page, e.g., select-role or dashboard
          // You might want logic here to check if role exists and redirect accordingly
          // For simplicity, redirecting to select-role like the old route handler did.
          router.replace('/select-role'); 
        }
      }
      exchangeCode();
    } else {
       // --- 3. No code and no hash error --- 
       logger.warn('[AUTH-CALLBACK-PAGE] Reached callback page without code or hash error.');
       toast({
        title: "Invalid State",
        description: "Invalid authentication callback state. Please try logging in again.",
        variant: "destructive",
       });
       router.replace('/login');
    }

  }, [searchParams, router, supabase]);

  // Display a loading indicator while processing
  return <LoadingSpinner />;
} 
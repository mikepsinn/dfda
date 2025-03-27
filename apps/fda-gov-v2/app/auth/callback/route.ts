import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { type EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: Request) {
  console.log('[AUTH-CALLBACK] Handling auth callback request');
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/patient/dashboard'
  
  console.log('[AUTH-CALLBACK] Parameters:', {
    hasCode: !!code,
    next,
    url: request.url
  });
  
  if (code) {
    console.log('[AUTH-CALLBACK] Exchanging code for session...');
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('[AUTH-CALLBACK] Failed to exchange code for session:', {
        error: error.message,
        status: error.status
      });
      return NextResponse.redirect(new URL('/auth/auth-code-error', request.url))
    }

    console.log('[AUTH-CALLBACK] Successfully exchanged code for session, redirecting to:', next);
    return NextResponse.redirect(new URL(next, request.url))
  }

  console.log('[AUTH-CALLBACK] No code provided, redirecting to error page');
  // Return the user to an error page with some instructions
  return NextResponse.redirect(new URL('/auth/auth-code-error', request.url))
}


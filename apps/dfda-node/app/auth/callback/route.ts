'use server';

import { createClient } from '@/utils/supabase/server'
import { logger } from '@/lib/logger'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  // Log relevant headers
  const headersList = request.headers;
  logger.debug('[AUTH-CALLBACK-ROUTE] Incoming Headers', { 
      host: headersList.get('host'),
      xForwardedHost: headersList.get('x-forwarded-host'),
      xForwardedProto: headersList.get('x-forwarded-proto'),
      referer: headersList.get('referer'),
      url: request.url 
  }); 

  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/'

  logger.info('[AUTH-CALLBACK-ROUTE] Received callback', { code: code ? '<present>' : '<missing>', next, origin: origin }); // Log received origin

  if (code) {
    const supabase = await createClient(); // Use server client
    try {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
          // Append origin if 'next' is a relative path
          const redirectUrl = next.startsWith('/') ? `${origin}${next}` : next;
          // Log calculated redirect info
          logger.info('[AUTH-CALLBACK-ROUTE] Successfully exchanged code, redirecting.', { 
            origin: origin,
            next: next,
            calculatedRedirectUrl: redirectUrl 
          });
          return NextResponse.redirect(redirectUrl);
        }
        // Log the specific exchange error
        logger.error('[AUTH-CALLBACK-ROUTE] Failed to exchange code for session:', { 
            error: error.message,
            status: (error as any).status 
        });
    } catch(catchError: any) {
        logger.error('[AUTH-CALLBACK-ROUTE] Exception during code exchange:', { error: catchError?.message ?? catchError });
    }
  }

  // Redirect to an error page if code is missing or exchange fails
  logger.warn('[AUTH-CALLBACK-ROUTE] Redirecting to login due to missing code or exchange error.', { origin });
  const redirectUrl = `${origin}/login?error=Could not sign in. Please try again.`;
  logger.info('[AUTH-CALLBACK-ROUTE] Calculated Error Redirect', { calculatedErrorUrl: redirectUrl });
  return NextResponse.redirect(redirectUrl);
} 
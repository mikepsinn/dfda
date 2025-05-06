'use server';

import { createClient } from '@/utils/supabase/server'
import { logger } from '@/lib/logger'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  // Log relevant headers
  const headersList = request.headers;
  const hostHeader = headersList.get('host'); // Renamed for clarity
  const forwardedHostHeader = headersList.get('x-forwarded-host'); // Renamed for clarity
  const protocolHeader = headersList.get('x-forwarded-proto'); // Renamed for clarity
  const referer = headersList.get('referer');
  const debugMsg = `[AUTH-CALLBACK-ROUTE] Incoming Headers: host=${hostHeader}, x-fwd-host=${forwardedHostHeader}, x-fwd-proto=${protocolHeader}, referer=${referer}, url=${request.url}`;
  logger.debug(debugMsg); 

  // --- START FIX: Reconstruct origin from headers (with localhost refinement) --- 
  // Determine protocol: Use header, fallback based on NODE_ENV
  const protocol = protocolHeader ?? (process.env.NODE_ENV === 'development' ? 'http' : 'https');

  // Determine host: Prioritize forwarded host, then host header
  const actualHost = forwardedHostHeader ?? hostHeader;
  
  // Ensure we have a valid host before proceeding
  if (!actualHost) {
      logger.error(`[AUTH-CALLBACK-ROUTE] Could not determine host from headers. host=${hostHeader}, x-fwd-host=${forwardedHostHeader}`);
      // Best effort error redirect
      const errorUrl = `${protocol}://${hostHeader || 'localhost'}/login?error=Internal Server Error - Invalid Host Configuration`; 
      return NextResponse.redirect(errorUrl);
  }
  const correctOrigin = `${protocol}://${actualHost}`;
  logger.info(`[AUTH-CALLBACK-ROUTE] Reconstructed Origin: ${correctOrigin}`);
  // --- END FIX --- 

  const { searchParams } = new URL(request.url) // Still need searchParams
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/'

  const receivedMsg = `[AUTH-CALLBACK-ROUTE] Received callback: code=${code ? '<present>' : '<missing>'}, next=${next}, (original incorrect origin=${new URL(request.url).origin})`;
  logger.info(receivedMsg); // Log received origin in msg

  if (code) {
    const supabase = await createClient(); // Use server client
    try {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
          // Append RECONSTRUCTED origin if 'next' is a relative path
          const redirectUrl = next.startsWith('/') ? `${correctOrigin}${next}` : next;
          // Log calculated redirect info
          const successMsg = `[AUTH-CALLBACK-ROUTE] Successfully exchanged code, redirecting. CorrectOrigin=${correctOrigin}, Next=${next}, CalculatedRedirectUrl=${redirectUrl}`;
          logger.info(successMsg);
          return NextResponse.redirect(redirectUrl);
        }
        // Log the specific exchange error
        // Keep structured error log
        logger.error('[AUTH-CALLBACK-ROUTE] Failed to exchange code for session:', { 
            error: error.message,
            status: (error as any).status 
        });
    } catch(catchError: any) {
        // Keep structured error log
        logger.error('[AUTH-CALLBACK-ROUTE] Exception during code exchange:', { error: catchError?.message ?? catchError });
    }
  }

  // Redirect to an error page if code is missing or exchange fails
  // Use reconstructed origin for error redirect as well
  const warnMsg = `[AUTH-CALLBACK-ROUTE] Redirecting to login due to missing code or exchange error. CorrectOrigin=${correctOrigin}`;
  logger.warn(warnMsg);
  const errorRedirectUrl = `${correctOrigin}/login?error=Could not sign in. Please try again.`;
  const errorRedirectMsg = `[AUTH-CALLBACK-ROUTE] Calculated Error Redirect: Url=${errorRedirectUrl}`;
  logger.info(errorRedirectMsg);
  return NextResponse.redirect(errorRedirectUrl);
} 
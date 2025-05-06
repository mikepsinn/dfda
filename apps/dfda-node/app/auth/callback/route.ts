'use server';

import { createClient } from '@/utils/supabase/server'
import { logger } from '@/lib/logger'
import { NextResponse, type NextRequest } from 'next/server'
import { Constants } from '@/lib/database.types'

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
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        // Check for exchange error first
        if (exchangeError) {
          logger.error('[AUTH-CALLBACK-ROUTE] Failed to exchange code for session:', { 
              error: exchangeError.message,
              status: (exchangeError as any).status 
          });
          // Redirect to error on exchange failure
          const errorRedirectUrl = `${correctOrigin}/login?error=Authentication failed. Please try again.`;
          return NextResponse.redirect(errorRedirectUrl);
        }

        // --- START: Fetch user profile and determine role-based redirect ---
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          logger.error('[AUTH-CALLBACK-ROUTE] Failed to get user after session exchange:', { error: userError?.message ?? 'User is null' });
          // Redirect to error if user fetch fails
          const errorRedirectUrl = `${correctOrigin}/login?error=Could not retrieve user details. Please try again.`;
          return NextResponse.redirect(errorRedirectUrl);
        }

        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', user.id)
          .single();

        let redirectPath = '/'; // Default path

        if (profileError) {
          logger.warn(`[AUTH-CALLBACK-ROUTE] Could not fetch profile for user ${user.id}. Using default redirect.`, { error: profileError.message });
          // Proceed with default redirect even if profile fetch fails, but log it
        } else if (profileData) {
          logger.info(`[AUTH-CALLBACK-ROUTE] User ${user.id} has user_type: ${profileData.user_type}`);
          switch (profileData.user_type) {
            case Constants.public.Enums.user_type_enum[0]: // 'patient'
              redirectPath = '/patient';
              break;
            case Constants.public.Enums.user_type_enum[1]: // 'provider'
              redirectPath = '/provider'; 
              break;
            // Add cases for other user types using Constants.public.Enums.user_type_enum[index]
            // case Constants.public.Enums.user_type_enum[2]: // 'research-partner'
            //   redirectPath = '/research'; 
            //   break;
            // case Constants.public.Enums.user_type_enum[3]: // 'admin'
            //   redirectPath = '/admin';
            //   break;
            // case Constants.public.Enums.user_type_enum[4]: // 'developer'
            //   redirectPath = '/developer';
            //   break;
            default:
              redirectPath = '/'; // Fallback to default dashboard or home
          }
        } else {
           logger.warn(`[AUTH-CALLBACK-ROUTE] No profile found for user ${user.id}. Using default redirect.`);
        }
        
        const finalRedirectUrl = `${correctOrigin}${redirectPath}`;
        logger.info(`[AUTH-CALLBACK-ROUTE] Determined redirect based on role: ${finalRedirectUrl}`);
        return NextResponse.redirect(finalRedirectUrl);
        // --- END: Fetch user profile and determine role-based redirect ---
        
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
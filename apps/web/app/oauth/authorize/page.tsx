import { redirect } from 'next/navigation';
// import { cookies } from 'next/headers'; // Removed unused import
import { createServerClient } from '@/utils/supabase/server';
import { supabaseAdmin } from '@/utils/supabase/admin';
// import { type Database } from '@/lib/database.types'; // Removed unused import
import { logger } from '@/lib/logger';
import { ConsentForm } from '@/components/oauth/ConsentForm';

// type OAuthClient = Database['public']['Tables']['oauth_clients']['Row']; // Removed unused type alias

interface AuthorizePageProps {
  searchParams: {
    response_type?: string;
    client_id?: string;
    redirect_uri?: string;
    scope?: string;
    state?: string;
    code_challenge?: string;
    code_challenge_method?: string;
    // Potentially other params like 'audience' if needed
  };
}

// Helper to construct redirect URLs with error parameters
function buildErrorRedirect(baseUrl: string, error: string, errorDescription: string, state?: string): string {
  const params = new URLSearchParams();
  params.append('error', error);
  params.append('error_description', errorDescription);
  if (state) {
    params.append('state', state);
  }
  try {
    const url = new URL(baseUrl);
    url.search = params.toString();
    return url.toString();
  } catch (e) {
    // Fallback if baseUrl is invalid, though this should be caught earlier
    logger.error("Invalid base URL for error redirect", { baseUrl, error: e });
    // In a real scenario, you might redirect to a generic error page on your own site
    // or handle this more gracefully. For now, attempting a basic redirect.
    const fallbackUrl = new URLSearchParams();
    fallbackUrl.append('error', 'server_error');
    fallbackUrl.append('error_description', 'Invalid client redirect URI configuration.');
    return `/?${fallbackUrl.toString()}`; // Redirect to home with error
  }
}

export default async function AuthorizePage({ searchParams }: AuthorizePageProps) {
  const {
    response_type,
    client_id,
    redirect_uri,
    scope,
    state,
    code_challenge,
    code_challenge_method,
  } = searchParams;

  // 0. Basic Parameter Validation
  if (response_type !== 'code') {
    // If redirect_uri is available and valid, use it. Otherwise, this error won't reach the client app.
    // This is a protocol violation, client should know this.
    const errorRedirect = redirect_uri 
      ? buildErrorRedirect(redirect_uri, 'unsupported_response_type', 'Response type must be "code".', state)
      : '/error?message=Unsupported response type. Check your OAuth client configuration.'; // Fallback to an error page on our site
    return redirect(errorRedirect);
  }

  if (!client_id) {
    const errorRedirect = redirect_uri
      ? buildErrorRedirect(redirect_uri, 'invalid_request', 'Missing client_id parameter.', state)
      : '/error?message=Missing client_id. Check your OAuth client configuration.';
    return redirect(errorRedirect);
  }

  if (!redirect_uri) {
    // This is a critical error. We don't know where to send the user back.
    // Log this and show a generic error page on our site.
    logger.error('Missing redirect_uri in /oauth/authorize request', { client_id });
    return redirect('/error?message=Missing redirect_uri. Your OAuth request is malformed.');
  }
  
  // Validate redirect_uri format before using it in further redirects
  try {
    new URL(redirect_uri);
  } catch (e) {
    logger.error('Invalid redirect_uri format in /oauth/authorize request', { client_id, redirect_uri, error: e });
    // We cannot trust this redirect_uri, so don't use it for error reporting to client.
    return redirect('/error?message=Invalid redirect_uri format. Check your OAuth client configuration.');
  }

  const supabase = await createServerClient(); // Uses our wrapper, no args, handles cookies

  // 1. User Authentication
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    logger.info('User not authenticated for OAuth flow. Redirecting to login.', { client_id, redirect_uri });
    const loginRedirectUrl = new URL('/login', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000');
    // Pass all current search params to the login page so it can redirect back here after login
    const originalRequestParams = new URLSearchParams(searchParams as Record<string, string>).toString();
    loginRedirectUrl.searchParams.set('redirectTo', `/oauth/authorize?${originalRequestParams}`);
    return redirect(loginRedirectUrl.toString());
  }

  // 2. Client Validation (using a service role client for direct DB access)
  // IMPORTANT: For production, ensure RLS is properly configured if not using service_role,
  // or ensure this service_role client is only used in secure server environments.
  
  // Use the pre-configured supabaseAdmin client
  const { data: oauthClient, error: clientDbError } = await supabaseAdmin // Use supabaseAdmin
    .from('oauth_clients')
    .select('*')
    .eq('client_id', client_id)
    .single();

  if (clientDbError || !oauthClient) {
    logger.warn('Invalid client_id or database error for /oauth/authorize', { client_id, error: clientDbError?.message });
    return redirect(buildErrorRedirect(redirect_uri, 'unauthorized_client', 'Invalid client ID or client not found.', state));
  }

  // Validate redirect_uri against registered URIs for the client
  const validRedirectUri = oauthClient.redirect_uris.includes(redirect_uri);
  if (!validRedirectUri) {
    logger.warn('Mismatched redirect_uri for client', { client_id, requested: redirect_uri, registered: oauthClient.redirect_uris });
    // As per OAuth spec, do not redirect to the invalid URI. Show an error on our site or use a registered default.
    // For simplicity, we'll redirect to a generic error page on our site.
    // A more robust solution would be to log this attempt and potentially notify the developer.
    return redirect('/error?message=Mismatched redirect_uri. Ensure the redirect_uri is registered for your client.');
  }
  
  // Validate scopes (basic check: ensure requested scopes are a subset of client's configured scopes or globally allowed scopes)
  // For now, let's assume all requested scopes are valid if 'scope' is provided, or use client's default if not.
  // A more robust implementation would parse and validate each requested scope against client's configuration.
  const requestedScopes = scope ? scope.split(' ') : (oauthClient.scope ? oauthClient.scope.split(' ') : ['openid']); // Default to 'openid' if nothing else
  
  // TODO: Implement more granular scope validation if needed.
  // For example, check if each requestedScope is present in oauthClient.scope.

  // 3. If all checks pass, display consent form
  // We'll pass client details and user info to the ConsentForm component
  logger.info('User authenticated and client validated. Proceeding to consent.', { userId: user.id, clientId: client_id });

  return (
    <ConsentForm
      client={{
        client_id: oauthClient.client_id,
        client_name: oauthClient.client_name || 'Unknown Application',
        logo_uri: oauthClient.logo_uri,
      }}
      user={{ email: user.email }}
      scopes={requestedScopes}
      csrfToken={state}
      code_challenge={code_challenge}
      code_challenge_method={code_challenge_method}
      redirect_uri={redirect_uri}
    />
  );
}

// Ensure this page is dynamically rendered as it depends on searchParams and user session
export const dynamic = 'force-dynamic'; 
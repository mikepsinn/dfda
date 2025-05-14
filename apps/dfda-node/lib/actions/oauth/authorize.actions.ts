'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation'; // For redirecting from server action if needed
import { createServerClient } from '@/utils/supabase/server';
import { supabaseAdmin } from '@/utils/supabase/admin';
import { logger } from '@/lib/logger';
import { type Database } from '@/lib/database.types';
import { publicOauthAuthorizationCodesInsertSchemaSchema } from '@/lib/database.schemas';
import crypto from 'crypto';

const LOG_PREFIX = '[ServerAction /oauth/authorize]';

// Helper to build redirect URLs with parameters
function buildRedirectUrl(baseUrl: string, params: Record<string, string>): string {
  try {
    const url = new URL(baseUrl);
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value);
    });
    return url.toString();
  } catch (e: any) {
    logger.error(`${LOG_PREFIX} Invalid base URL for redirect`, { baseUrl, error: e.message });
    // Fallback in case of an invalid redirect_uri, though this should be caught earlier.
    // Redirect to a generic error page on our domain.
    const errorParams = new URLSearchParams();
    errorParams.append('error', 'server_error');
    errorParams.append('error_description', 'Invalid client redirect URI configuration after consent.');
    return `/?${errorParams.toString()}`; // Redirect to home with error
  }
}

const ConsentFormDataSchema = z.object({
  decision: z.enum(['approve', 'deny']),
  client_id: z.string().uuid('Invalid Client ID format'),
  redirect_uri: z.string().url('Invalid Redirect URI format'),
  scope: z.string().optional(), // Space-separated string of scopes
  state: z.string().optional(), // CSRF token
  code_challenge: z.string().optional(),
  code_challenge_method: z.string().optional(),
});

export type HandleConsentResult = 
  | { success: true; redirect_to: string }
  | { success: false; error: string; error_description?: string; state?: string };

export async function handleConsent(formData: FormData): Promise<HandleConsentResult> {
  const rawData = Object.fromEntries(formData.entries());
  const parsedInput = ConsentFormDataSchema.safeParse(rawData);

  if (!parsedInput.success) {
    logger.warn(`${LOG_PREFIX} Invalid form data:`, { errors: parsedInput.error.flatten() });
    // We might not have a valid redirect_uri here if it failed parsing.
    // It's tricky to redirect with an error to the client app if the client_id/redirect_uri itself is bad.
    return { success: false, error: 'invalid_request', error_description: 'Malformed consent data.' };
  }

  const {
    decision,
    client_id,
    redirect_uri,
    scope: requestedScopeString,
    state,
    code_challenge,
    code_challenge_method,
  } = parsedInput.data;

  const supabase = await createServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    logger.warn(`${LOG_PREFIX} User not authenticated during consent handling.`);
    // This case should ideally be handled before even showing the consent form,
    // but as a safeguard in the action:
    return { 
      success: false, 
      error: 'access_denied', 
      error_description: 'User authentication required.', 
      state 
    };
  }

  // Re-validate client and redirect_uri (similar to authorize page)
  const { data: oauthClient, error: clientDbError } = await supabaseAdmin
    .from('oauth_clients')
    .select('client_id, client_name, redirect_uris, scope') // Select necessary fields
    .eq('client_id', client_id)
    .is('deleted_at', null)
    .single();

  if (clientDbError || !oauthClient) {
    logger.warn(`${LOG_PREFIX} Invalid client_id or DB error during consent:`, { client_id, error: clientDbError?.message });
    return { 
      success: false, 
      error: 'unauthorized_client', 
      error_description: 'Invalid client ID or client not found.', 
      state 
      // Don't use potentially malicious redirect_uri here, error shown on our page or default
    };
  }

  if (!oauthClient.redirect_uris.includes(redirect_uri)) {
    logger.warn(`${LOG_PREFIX} Mismatched redirect_uri during consent:`, { client_id, requested: redirect_uri, registered: oauthClient.redirect_uris });
    return { 
      success: false, 
      error: 'invalid_request', 
      error_description: 'Redirect URI mismatch.', 
      state 
    };
  }

  if (decision === 'deny') {
    logger.info(`${LOG_PREFIX} User ${user.id} denied consent for client ${client_id}.`);
    const redirectUrl = buildRedirectUrl(redirect_uri, {
      error: 'access_denied',
      error_description: 'The user denied the request.',
      ...(state && { state }),
    });
    return { success: true, redirect_to: redirectUrl };
  }

  // Decision is 'approve'
  try {
    const authorizationCode = crypto.randomBytes(32).toString('hex');
    const codeExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // Validate and determine final scopes
    // For now, we'll use the requested scopes if provided, or the client's default scopes.
    // A more robust implementation would intersect requested scopes with client's allowed scopes.
    const finalScope = requestedScopeString || oauthClient.scope || 'openid';

    const codeToInsert: z.infer<typeof publicOauthAuthorizationCodesInsertSchemaSchema> = {
      code: authorizationCode,
      client_id: oauthClient.client_id,
      user_id: user.id,
      redirect_uri, // Store the validated redirect_uri used for this request
      scope: finalScope, 
      expires_at: codeExpiresAt.toISOString(),
      // PKCE params are nullable in the DB schema if not provided
      ...(code_challenge && { code_challenge }),
      ...(code_challenge_method && { code_challenge_method }),
    };

    // Final check with the DB schema before insert
    const validatedCodeData = publicOauthAuthorizationCodesInsertSchemaSchema.safeParse(codeToInsert);
    if (!validatedCodeData.success) {
        logger.error(`${LOG_PREFIX} Failed to validate authorization code data before insert:`, { errors: validatedCodeData.error.flatten(), data: codeToInsert });
        return { success: false, error: 'server_error', error_description: 'Internal error preparing authorization code.', state };
    }

    const { error: insertError } = await supabaseAdmin
      .from('oauth_authorization_codes')
      .insert(validatedCodeData.data);

    if (insertError) {
      logger.error(`${LOG_PREFIX} Failed to store authorization code for user ${user.id}, client ${client_id}:`, { error: insertError });
      return { success: false, error: 'server_error', error_description: 'Could not issue authorization code.', state };
    }

    logger.info(`${LOG_PREFIX} User ${user.id} approved consent. Authorization code generated for client ${client_id}.`);
    const successRedirectUrl = buildRedirectUrl(redirect_uri, {
      code: authorizationCode,
      ...(state && { state }),
    });
    return { success: true, redirect_to: successRedirectUrl };

  } catch (e: any) {
    logger.error(`${LOG_PREFIX} Unexpected error during consent approval for user ${user.id}, client ${client_id}:`, { error: e });
    return { success: false, error: 'server_error', error_description: 'An unexpected error occurred.', state };
  }
} 
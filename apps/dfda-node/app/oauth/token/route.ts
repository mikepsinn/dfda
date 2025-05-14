import { type NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabase/admin';
import { logger } from '@/lib/logger';
import { Argon2id } from 'oslo/password';
import { SignJWT } from 'jose'; // For creating JWTs
import { type Database } from '@/lib/database.types';
import { TokenRequestSchema, type TokenRequestInput } from '@/lib/actions/oauth/token.schemas';
import crypto from 'crypto';
import { env } from '@/lib/env';

const LOG_PREFIX = '[Route /oauth/token]';

// Helper to generate a JWT
async function generateJwt(userId: string, clientId: string, scopes: string[]): Promise<string> {
  const secret = new TextEncoder().encode(env.SUPABASE_JWT_SECRET);
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = env.ACCESS_TOKEN_EXPIRES_IN_SECONDS; // e.g., 3600 for 1 hour

  const jwt = await new SignJWT({
    aud: 'authenticated', // Standard Supabase audience
    exp: now + expiresIn,
    sub: userId,
    iss: env.NEXT_PUBLIC_SITE_URL, // Issuer
    // Custom claims
    client_id: clientId,
    scope: scopes.join(' '), // Space-separated string of granted scopes
    // role: 'authenticated', // Default Supabase role
    // aal: 'aal1', // Default Supabase AAL
    // session_id: uuidv4(), // Could generate a unique session ID for the token if needed for advanced tracking/revocation
  })
  .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
  .setIssuedAt(now)
  .setNotBefore(now)
  .sign(secret);
  
  return jwt;
}

// Helper to generate a refresh token (opaque string)
function generateRefreshToken(): string {
  return crypto.randomBytes(40).toString('hex');
}

// TODO: Implement a way to store refresh tokens securely
// For example, in a new 'oauth_refresh_tokens' table associated with user_id, client_id, token_hash, expires_at.


export async function POST(request: NextRequest) {
  let requestBody: TokenRequestInput;

  try {
    const rawBody = await request.json();
    const parsed = TokenRequestSchema.safeParse(rawBody);
    if (!parsed.success) {
      logger.warn(`${LOG_PREFIX} Invalid request body:`, { errors: parsed.error.flatten() });
      return NextResponse.json(
        { error: 'invalid_request', error_description: 'Invalid token request.', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    requestBody = parsed.data;
  } catch (error) {
    logger.warn(`${LOG_PREFIX} Failed to parse request body as JSON:`, { error });
    return NextResponse.json({ error: 'invalid_request', error_description: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const {
    grant_type,
    code: authorizationCode,
    redirect_uri,
    client_id,
    client_secret,
    code_verifier,
  } = requestBody;

  // --- 1. Client Authentication & Validation ---
  const { data: oauthClient, error: clientDbError } = await supabaseAdmin
    .from('oauth_clients')
    .select('client_id, client_secret, client_secret_hashed, grant_types, response_types, client_type, redirect_uris, scope') // Include client_type (public/confidential)
    .eq('client_id', client_id)
    .is('deleted_at', null)
    .single();

  if (clientDbError || !oauthClient) {
    logger.warn(`${LOG_PREFIX} Client not found or DB error:`, { client_id, error: clientDbError?.message });
    return NextResponse.json({ error: 'invalid_client', error_description: 'Client authentication failed.' }, { status: 401 });
  }

  // Client Type specific validation (client_secret for confidential, PKCE for public)
  if (oauthClient.client_type === 'confidential') {
    if (!client_secret) {
      logger.warn(`${LOG_PREFIX} Missing client_secret for confidential client:`, { client_id });
      return NextResponse.json({ error: 'invalid_client', error_description: 'Client secret is required for confidential clients.' }, { status: 401 });
    }
    // Verify client_secret
    let isValidSecret = false;
    if (oauthClient.client_secret_hashed) {
      // Ensure client_secret_hashed is not null or undefined before using it
      if (oauthClient.client_secret_hashed) {
        isValidSecret = await new Argon2id().verify(oauthClient.client_secret_hashed, client_secret);
      } else {
        // This case should ideally not be reached if client_secret_hashed is expected for confidential clients that use hashing
        logger.error(`${LOG_PREFIX} Confidential client ${client_id} has client_secret_hashed field but it is null/undefined.`);
        return NextResponse.json({ error: 'server_error', error_description: 'Client configuration error (hashed secret missing).' }, { status: 500 });
      }
    } else if (oauthClient.client_secret) {
      // Fallback for plain text secret (not recommended, for migration or specific cases)
      isValidSecret = oauthClient.client_secret === client_secret;
      if (isValidSecret) {
        logger.warn(`${LOG_PREFIX} Client ${client_id} is using a plain text secret. Consider migrating to hashed secrets.`);
      }
    } else {
      // Neither client_secret_hashed nor client_secret is available
      logger.error(`${LOG_PREFIX} Confidential client ${client_id} has no stored secret (neither plain nor hashed).`);
      return NextResponse.json({ error: 'server_error', error_description: 'Client configuration error (secret missing).' }, { status: 500 });
    }

    if (!isValidSecret) {
      logger.warn(`${LOG_PREFIX} Invalid client_secret for confidential client:`, { client_id });
      return NextResponse.json({ error: 'invalid_client', error_description: 'Invalid client secret.' }, { status: 401 });
    }
  } else if (oauthClient.client_type === 'public') {
    if (!code_verifier) {
      logger.warn(`${LOG_PREFIX} Missing code_verifier for public client (PKCE):`, { client_id });
      return NextResponse.json({ error: 'invalid_grant', error_description: 'Code verifier required for PKCE.' }, { status: 400 });
    }
    // PKCE validation will happen after fetching the auth code
  } else {
    logger.error(`${LOG_PREFIX} Unknown client_type for client:`, { client_id, type: oauthClient.client_type });
    return NextResponse.json({ error: 'server_error', error_description: 'Unsupported client type configuration.' }, { status: 500 });
  }
  
  // --- 2. Authorization Code Validation ---
  const { data: authCodeDetails, error: codeDbError } = await supabaseAdmin
    .from('oauth_authorization_codes')
    .select('*')
    .eq('code', authorizationCode)
    .single();

  if (codeDbError || !authCodeDetails) {
    logger.warn(`${LOG_PREFIX} Authorization code not found or DB error:`, { code: authorizationCode, error: codeDbError?.message });
    return NextResponse.json({ error: 'invalid_grant', error_description: 'Invalid or expired authorization code.' }, { status: 400 });
  }

  // Check if code is expired
  if (new Date(authCodeDetails.expires_at) < new Date()) {
    logger.warn(`${LOG_PREFIX} Expired authorization code used:`, { code: authorizationCode, client_id });
    // As a security measure, also delete the expired code
    await supabaseAdmin.from('oauth_authorization_codes').delete().eq('id', authCodeDetails.id);
    return NextResponse.json({ error: 'invalid_grant', error_description: 'Authorization code has expired.' }, { status: 400 });
  }

  // Check if code was issued to the same client_id
  if (authCodeDetails.client_id !== client_id) {
    logger.warn(`${LOG_PREFIX} Authorization code client_id mismatch:`, { code: authorizationCode, expected: authCodeDetails.client_id, actual: client_id });
    return NextResponse.json({ error: 'invalid_grant', error_description: 'Authorization code client mismatch.' }, { status: 400 });
  }

  // Check if redirect_uri matches
  if (authCodeDetails.redirect_uri !== redirect_uri) {
    logger.warn(`${LOG_PREFIX} Authorization code redirect_uri mismatch:`, { code: authorizationCode, expected: authCodeDetails.redirect_uri, actual: redirect_uri });
    return NextResponse.json({ error: 'invalid_grant', error_description: 'Redirect URI mismatch.' }, { status: 400 });
  }

  // --- 3. PKCE Validation (if applicable) ---
  if (oauthClient.client_type === 'public') {
    if (!authCodeDetails.code_challenge || !authCodeDetails.code_challenge_method) {
      logger.warn(`${LOG_PREFIX} Auth code ${authCodeDetails.id} missing PKCE challenge details, but client ${client_id} is public.`);
      return NextResponse.json({ error: 'invalid_grant', error_description: 'PKCE challenge not found for this authorization code.' }, { status: 400 });
    }
    if (authCodeDetails.code_challenge_method === 'S256') {
      const hashedVerifier = crypto
        .createHash('sha256')
        .update(code_verifier!)
        .digest('base64url'); // Ensure Base64 URL encoding without padding
      if (hashedVerifier !== authCodeDetails.code_challenge) {
        logger.warn(`${LOG_PREFIX} PKCE S256 challenge failed:`, { client_id, code: authorizationCode });
        return NextResponse.json({ error: 'invalid_grant', error_description: 'PKCE challenge failed.' }, { status: 400 });
      }
    } else if (authCodeDetails.code_challenge_method === 'plain') {
      if (code_verifier !== authCodeDetails.code_challenge) {
        logger.warn(`${LOG_PREFIX} PKCE plain challenge failed:`, { client_id, code: authorizationCode });
        return NextResponse.json({ error: 'invalid_grant', error_description: 'PKCE challenge failed.' }, { status: 400 });
      }
    } else {
      logger.warn(`${LOG_PREFIX} Unsupported PKCE method:`, { client_id, method: authCodeDetails.code_challenge_method });
      return NextResponse.json({ error: 'invalid_grant', error_description: 'Unsupported PKCE method.' }, { status: 400 });
    }
  }

  // --- 4. Invalidate Authorization Code (it's single-use) ---
  const { error: deleteCodeError } = await supabaseAdmin
    .from('oauth_authorization_codes')
    .delete()
    .eq('id', authCodeDetails.id);

  if (deleteCodeError) {
    // This is serious. If we can't delete the code, it could be reused.
    // Log critical error and deny token issuance.
    logger.error(`${LOG_PREFIX} CRITICAL: Failed to delete used authorization code:`, { codeId: authCodeDetails.id, error: deleteCodeError });
    return NextResponse.json({ error: 'server_error', error_description: 'Failed to invalidate authorization code.' }, { status: 500 });
  }

  // --- 5. Issue Tokens ---
  const userId = authCodeDetails.user_id;
  const grantedScopes = authCodeDetails.scope ? authCodeDetails.scope.split(' ') : ['openid']; // Use scopes from auth code

  try {
    const accessToken = await generateJwt(userId, client_id, grantedScopes);
    const refreshToken = generateRefreshToken(); // Opaque string
    const accessTokenExpiresIn = env.ACCESS_TOKEN_EXPIRES_IN_SECONDS;

    // TODO: Store refresh token securely (hashed) in the database
    // Table: oauth_refresh_tokens (id, token_hash, client_id, user_id, scopes, expires_at, created_at, revoked_at)
    // const refreshTokenExpiresAt = new Date(Date.now() + env.REFRESH_TOKEN_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000);
    // const hashedRefreshToken = await new Argon2id().hash(refreshToken); // If storing hashed refresh tokens
    /*
    await supabaseAdmin.from('oauth_refresh_tokens').insert({
      token_hash: hashedRefreshToken, // Or just the token if not hashing (less secure for DB leaks)
      client_id: client_id,
      user_id: userId,
      scopes: grantedScopes.join(' '),
      expires_at: refreshTokenExpiresAt.toISOString(),
    });
    */

    logger.info(`${LOG_PREFIX} Tokens issued successfully for client ${client_id}, user ${userId}.`);

    return NextResponse.json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: accessTokenExpiresIn,
      refresh_token: refreshToken,
      scope: grantedScopes.join(' '), // Return the granted scopes
    });

  } catch (jwtError: any) {
    logger.error(`${LOG_PREFIX} Error generating JWT:`, { error: jwtError });
    return NextResponse.json({ error: 'server_error', error_description: 'Failed to generate access token.' }, { status: 500 });
  }
} 
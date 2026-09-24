// E:/code/decentralized-fda/apps/dfda-node/sdks/dfda-auth-sdk.ts
import { createClient, SupabaseClient, Session, User, AuthChangeEvent, Subscription } from '@supabase/supabase-js';

// Global state for the SDK
// let supabase: SupabaseClient | null = null; // Will be removed or re-purposed if SDK needs direct Supabase calls for specific, isolated features not via proxy.
let clientRedirectUri: string | null = null; 
let baseApiUrl: string | null = null;
let accessToken: string | null = null; // To store the OAuth access token
let platformClientId: string | null = null;
// Optional: If your platform's auth server URLs are configurable. 
// Otherwise, they could be hardcoded if static.
let platformAuthorizationUrl: string | null = null; 
let platformTokenUrl: string | null = null;
let useLocalStorageForToken = false; // New global to control token storage
const TOKEN_STORAGE_KEY = 'dfda_sdk_access_token';
let refreshTokenValue: string | null = null; // New global for refresh token
const REFRESH_TOKEN_STORAGE_KEY = 'dfda_sdk_refresh_token';

// Variable to prevent infinite refresh loops
let isRefreshingToken = false;

const USER_PROFILE_PATH = '/auth/v1/user'; // Common Supabase user profile path

export interface DfdaSdkOptions {
  // supabaseUrl: string; // Removed
  // supabaseAnonKey: string; // Removed
  
  /**
   * The base URL of your DFDA API proxy.
   * e.g., 'https://your-app.com/api/sb' or 'http://localhost:3000/api/sb'
   */
  baseApiUrl: string;
  /**
   * The Client ID of your OAuth application registered on the DFDA Developer Portal.
   */
  clientId: string;
  /**
   * The URI to redirect the client to after successful authorization on the DFDA platform.
   * This must match one of the redirect URIs registered for your OAuth application.
   */
  clientRedirectUri: string;
  /**
   * The URL of the DFDA platform's OAuth 2.0 authorization endpoint.
   * e.g., 'https://your-dfda-platform.com/oauth/authorize'
   */
  authorizationUrl: string;
   /**
   * The URL of the DFDA platform's OAuth 2.0 token endpoint.
   * e.g., 'https://your-dfda-platform.com/oauth/token'
   */
  tokenUrl: string;
  // Optional: Default scopes if any
  defaultScopes?: string[];
  /**
   * If true, the SDK will attempt to store the access token in localStorage.
   * Defaults to false (in-memory storage).
   * Note: localStorage is vulnerable to XSS if your site has such vulnerabilities.
   * For maximum security, consider managing tokens via HttpOnly cookies through your backend 
   * or letting the consuming application manage token storage and use setAccessToken().
   */
  useLocalStorage?: boolean; 
}

function ensureSdkInitialized(): void { // No longer returns SupabaseClient
  if (!baseApiUrl || !platformClientId || !clientRedirectUri || !platformAuthorizationUrl || !platformTokenUrl) {
    throw new Error(
      'DFDA SDK not initialized or core OAuth configuration missing. Call initDfdaSdk first with baseApiUrl, clientId, clientRedirectUri, authorizationUrl, and tokenUrl.'
    );
  }
  // We might check for accessToken presence specifically in functions that need it.
}

export function initDfdaSdk(options: DfdaSdkOptions): void {
  if (!options.baseApiUrl) {
    throw new Error('DFDA API Proxy base URL (baseApiUrl) is required for SDK initialization.');
  }
  if (!options.clientId) {
    throw new Error('OAuth Client ID (clientId) is required for SDK initialization.');
  }
  if (!options.clientRedirectUri) {
    throw new Error('OAuth Client Redirect URI (clientRedirectUri) is required for SDK initialization.');
  }
  if (!options.authorizationUrl) {
    throw new Error('Platform OAuth Authorization URL (authorizationUrl) is required.');
  }
  if (!options.tokenUrl) {
    throw new Error('Platform OAuth Token URL (tokenUrl) is required.');
  }

  // Clear any previous state if re-initializing
  // supabase = null; // No longer directly managing a supabase client here
  accessToken = null;
  refreshTokenValue = null; // Reset refresh token on init
  console.warn('DFDA SDK Initializing/Re-initializing with OAuth flow.');

  baseApiUrl = options.baseApiUrl.replace(/\/$/, ''); // Remove trailing slash
  platformClientId = options.clientId;
  clientRedirectUri = options.clientRedirectUri;
  platformAuthorizationUrl = options.authorizationUrl.replace(/\/$/, '');
  platformTokenUrl = options.tokenUrl.replace(/\/$/, '');
  useLocalStorageForToken = !!options.useLocalStorage; // Set based on option
  
  if (useLocalStorageForToken) {
    try {
      const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (storedToken) {
        accessToken = storedToken;
        console.log('DFDA SDK: Access token loaded from localStorage.');
      }
      const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
      if (storedRefreshToken) {
        refreshTokenValue = storedRefreshToken;
        console.log('DFDA SDK: Refresh token loaded from localStorage.');
      }
    } catch (error) {
      console.warn('DFDA SDK: localStorage not available or accessible for both tokens. They will be stored in memory only.', error);
      // No need to change useLocalStorageForToken here, it's for both tokens
    }
  }
  
  console.log('DFDA SDK Initialized for OAuth flow.', {
    baseApiUrl,
    clientId: platformClientId,
    clientRedirectUri,
    authorizationUrl: platformAuthorizationUrl,
    tokenUrl: platformTokenUrl,
    useLocalStorageForToken
  });

  // The old supabase.auth.onAuthStateChange is no longer relevant here.
  // Token management will be more explicit via SDK methods.
}

// Placeholder for Supabase types if needed for specific passthrough, can be removed if not used directly
// type SupabaseSession = Session;
// type SupabaseUser = User;
// type SupabaseAuthChangeEvent = AuthChangeEvent;
// type SupabaseSubscription = Subscription;

// PKCE Helper functions
async function generatePkcePair(): Promise<{ verifier: string; challenge: string }> {
  const verifier = generateRandomString(128);
  const challenge = await generateCodeChallenge(verifier);
  return { verifier, challenge };
}

function generateRandomString(length: number): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~S';
  let text = '';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  
  // Base64URL encode
  // @ts-ignore: For environments where btoa might not be typed correctly or for broader compatibility
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

const PKCE_VERIFIER_KEY = 'dfda_sdk_pkce_verifier';

/**
 * Returns the URL to the platform's OAuth 2.0 authorization endpoint 
 * to initiate the login flow.
 * @param scopes - An array of scope strings requesting access.
 * @param state - An optional opaque value used to maintain state between the request and callback.
 * @returns The fully constructed authorization URL.
 */
export async function getAuthorizationUrl(scopes?: string[], state?: string): Promise<string> {
  ensureSdkInitialized();
  const internalScopes = scopes || [];

  const { verifier, challenge } = await generatePkcePair();
  try {
    // Attempt to use sessionStorage. Fallback or error handling might be needed for non-browser environments.
    sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier);
  } catch (error) {
    console.warn('DFDA SDK: sessionStorage not available for PKCE verifier. PKCE flow might fail if verifier is not handled manually.', error);
    // Optionally, could return the verifier for the app to store if sessionStorage fails.
  }

  const queryParams = new URLSearchParams({
    client_id: platformClientId!,
    redirect_uri: clientRedirectUri!,
    response_type: 'code',
    scope: internalScopes.join(' '),
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });

  if (state) {
    queryParams.set('state', state);
  }

  return `${platformAuthorizationUrl}?${queryParams.toString()}`;
}

/**
 * Exchanges an authorization code for an access token.
 * @param code - The authorization code received from the authorization server.
 * @returns A promise that resolves to the JSON response from the token endpoint (typically includes access_token, token_type, expires_in, refresh_token, scope).
 * @throws Will throw an error if the token exchange fails.
 */
export async function exchangeCodeForToken(code: string /* codeVerifier removed as param, will be retrieved from storage */): Promise<any> {
  ensureSdkInitialized();
  let codeVerifier: string | null = null;

  try {
    codeVerifier = sessionStorage.getItem(PKCE_VERIFIER_KEY);
    if (codeVerifier) {
      sessionStorage.removeItem(PKCE_VERIFIER_KEY); // Clean up after use
    } else {
      throw new Error('PKCE code_verifier not found in sessionStorage. It might have expired or was not set.');
    }
  } catch (error) {
    console.warn('DFDA SDK: Error retrieving PKCE code_verifier from sessionStorage. Token exchange will proceed without it, which may fail if PKCE is enforced by the server.', error);
    // If this is a critical error (PKCE is always required), we should throw here.
    // For now, we allow it to proceed and the server will reject if PKCE is mandatory & verifier is missing.
  }

  const bodyParams = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: clientRedirectUri!,
    client_id: platformClientId!,
  });

  if (codeVerifier) {
    bodyParams.set('code_verifier', codeVerifier);
  } else {
    // This case should ideally not happen if PKCE is consistently used and sessionStorage works.
    console.warn('Proceeding with token exchange without PKCE code_verifier. This is insecure for public clients if not using a pre-registered client_secret.');
  }

  const response = await fetch(platformTokenUrl!, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: bodyParams.toString(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Token exchange failed with status: ' + response.status }));
    console.error('Token exchange error:', errorData);
    throw new Error(errorData.message || `Token exchange failed: ${response.statusText}`);
  }

  const tokenResponse = await response.json();
  if (tokenResponse.access_token) {
    setAccessToken(tokenResponse.access_token);
  } else {
    console.error('Access token not found in token response:', tokenResponse);
    throw new Error('Access token not found in the response from token endpoint.');
  }
  
  if (tokenResponse.refresh_token) {
    setRefreshToken(tokenResponse.refresh_token);
  } else {
    // It's not always an error if a refresh token isn't provided (e.g. resource owner password credentials grant)
    // but for authorization_code flow, it's common.
    console.warn('Refresh token not found in token response. Token refresh will not be possible.');
  }
  return tokenResponse;
}

/**
 * Sets the access token for the SDK to use in authenticated requests.
 * @param token The OAuth access token.
 */
export function setAccessToken(token: string | null): void {
  // ensureSdkInitialized(); // Not strictly needed if just setting/clearing token, but ensures config is loaded for other ops.
  accessToken = token;
  if (token) {
    if (useLocalStorageForToken) {
      try {
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
      } catch (error) {
        console.warn('DFDA SDK: Failed to save token to localStorage.', error);
      }
    }
    console.log('DFDA SDK: Access token set.');
  } else {
    if (useLocalStorageForToken) {
      try {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      } catch (error) {
        console.warn('DFDA SDK: Failed to remove token from localStorage.', error);
      }
    }
    console.log('DFDA SDK: Access token cleared.');
  }
}

/**
 * Gets the current access token.
 * @returns The stored access token, or null if not set.
 */
export function getAccessToken(): string | null {
  // If not using localStorage, or if accessToken is already populated (e.g. by init or setAccessToken), return it.
  if (!useLocalStorageForToken || accessToken) {
    return accessToken;
  }
  // If using localStorage and accessToken is not yet populated in memory for this session, try to load it.
  // This covers the case where initDfdaSdk might have failed to load it from localStorage (e.g. if called before localStorage was ready or in a different context)
  // or if the token was set in another tab.
  try {
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (storedToken) {
        accessToken = storedToken; // Cache in memory for this session
        return accessToken;
    }
  } catch (error) {
    console.warn('DFDA SDK: Could not access localStorage to get token.', error);
  }
  return null;
}

/**
 * Sets the refresh token for the SDK.
 * @param token The OAuth refresh token.
 */
function setRefreshToken(token: string | null): void {
  refreshTokenValue = token;
  if (token) {
    if (useLocalStorageForToken) {
      try {
        localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, token);
      } catch (error) {
        console.warn('DFDA SDK: Failed to save refresh token to localStorage.', error);
      }
    }
    console.log('DFDA SDK: Refresh token set.');
  } else {
    if (useLocalStorageForToken) {
      try {
        localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
      } catch (error) {
        console.warn('DFDA SDK: Failed to remove refresh token from localStorage.', error);
      }
    }
    console.log('DFDA SDK: Refresh token cleared.');
  }
}

/**
 * Clears the stored access token, effectively logging the user out from the SDK's perspective.
 * Note: This does not revoke the token on the authorization server.
 */
export async function logout(): Promise<void> {
  const tokenToClear = getAccessToken(); // Get current token to log its clearance
  accessToken = null; // Clear in-memory token first
  setRefreshToken(null); // Clear refresh token as well

  if (useLocalStorageForToken) {
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch (error) {
      console.warn('DFDA SDK: Failed to remove token from localStorage during logout.', error);
    }
  }
  if (tokenToClear) {
      console.log('DFDA SDK: User logged out (access token cleared).');
  } else {
      console.log('DFDA SDK: Logout called, no active token to clear.');
  }
  // Optionally: redirect to a platform logout endpoint.
}

export async function refreshToken(): Promise<string | null> {
  ensureSdkInitialized();
  const currentRefreshToken = refreshTokenValue; // Use in-memory first

  if (!currentRefreshToken && useLocalStorageForToken) {
      try {
        const storedToken = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
        if (storedToken) refreshTokenValue = storedToken;
      } catch (e) { /* ignore */ }
  }

  if (!refreshTokenValue) {
    console.warn('DFDA SDK: No refresh token available. Cannot refresh access token.');
    return null;
  }

  const bodyParams = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshTokenValue,
    client_id: platformClientId!,
    // client_secret is typically not sent by public clients for refresh token grant
  });

  try {
    console.log('DFDA SDK: Attempting to refresh access token...');
    const response = await fetch(platformTokenUrl!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: bodyParams.toString(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Token refresh failed with status: ' + response.status }));
      console.error('Token refresh error:', errorData);
      // If refresh fails (e.g. token revoked or invalid), clear the stored refresh token to prevent further failed attempts.
      if (response.status === 400 || response.status === 401) { // Bad request or Unauthorized from invalid refresh token
        setRefreshToken(null);
      }
      throw new Error(errorData.message || `Token refresh failed: ${response.statusText}`);
    }

    const tokenResponse = await response.json();
    if (tokenResponse.access_token) {
      setAccessToken(tokenResponse.access_token);
      // Some OAuth servers issue a new refresh token with each access token refresh.
      // If so, update the stored refresh token.
      if (tokenResponse.refresh_token) {
        setRefreshToken(tokenResponse.refresh_token);
      } else {
        // If no new refresh token is issued, the old one *might* still be valid.
        // However, some servers invalidate the old refresh token upon use. This behavior varies.
        // For simplicity here, if no new one, we keep the old one. Could add logic to clear if server invalidates.
        console.log('DFDA SDK: Access token refreshed. No new refresh token issued.');
      }
      return tokenResponse.access_token;
    } else {
      console.error('Access token not found in refresh token response:', tokenResponse);
      throw new Error('Access token not found in the response from token endpoint during refresh.');
    }
  } catch (error) {
    console.error('DFDA SDK: Failed to refresh token.', error);
    return null; // Indicate failure
  }
}

// --- Old Supabase-dependent functions (to be removed or refactored) ---
/*
export async function loginWithProvider(provider: 'google' | 'github'): Promise<void> {
  const supabaseClient = ensureSdkInitialized(); // This line would fail now
  if (!clientRedirectUri) { 
      throw new Error('Client redirect URI not configured during SDK initialization.');
  }
  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: provider,
    options: {
      redirectTo: clientRedirectUri,
    },
  });
  if (error) {
    console.error(`Error during ${provider} login redirect:`, error);
    throw error;
  }
}

export async function getSession(): Promise<Session | null> {
  const supabaseClient = ensureSdkInitialized();
  const { data, error } = await supabaseClient.auth.getSession();
  if (error) {
    console.error('Error getting session:', error);
    return null; 
  }
  return data.session;
}

export async function getUser(): Promise<User | null> {
  const supabaseClient = ensureSdkInitialized();
  const { data, error } = await supabaseClient.auth.getUser();
   if (error) {
    console.error('Error getting user:', error);
    return null;
  }
  return data.user;
}

export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void
): { data: { subscription: Subscription } } | null {
  const supabaseClient = ensureSdkInitialized();
  const result = supabaseClient.auth.onAuthStateChange(callback);
  if (!result || !result.data || !result.data.subscription) {
      console.error('Failed to subscribe to auth state changes.');
      return null;
  }
  return result;
}
*/

export async function authenticatedFetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
  ensureSdkInitialized();
  const token = getAccessToken();

  if (!token) {
    console.warn('DFDA SDK: No access token available. authenticatedFetch cannot proceed.');
    // Or, depending on desired behavior, could throw an error or return a mock Response indicating auth failure.
    // For now, let it proceed, and the server will likely reject it.
  }

  const headers = new Headers(init?.headers);
  if (token) {
  headers.set('Authorization', `Bearer ${token}`);
  }

  const requestInit: RequestInit = {
    ...init,
    headers,
  };

  // Make the initial request
  let response = await fetch(input, requestInit);

  // If the request failed due to authorization (401), and we haven't already tried refreshing,
  // and a refresh token is available, try to refresh the token and retry the request once.
  if (response.status === 401 && !isRefreshingToken && (refreshTokenValue || (useLocalStorageForToken && localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)))) {
    console.log('DFDA SDK: authenticatedFetch received 401. Attempting token refresh...');
    isRefreshingToken = true;

    try {
      const newAccessToken = await refreshToken(); // refreshToken() handles setting the new token internally
      if (newAccessToken) {
        console.log('DFDA SDK: Token refreshed successfully. Retrying original request...');
        headers.set('Authorization', `Bearer ${newAccessToken}`);
        const retryRequestInit: RequestInit = { ...requestInit, headers };
        response = await fetch(input, retryRequestInit); // Retry the request
      } else {
        console.warn('DFDA SDK: Token refresh failed. Original 401 response will be returned.');
        // If refresh fails, logout or clear tokens to force re-authentication
        // await logout(); // Optionally force logout
      }
    } catch (refreshError) {
      console.error('DFDA SDK: Error during token refresh attempt:', refreshError);
      // If refresh attempt itself throws, original 401 response is still relevant
    } finally {
      isRefreshingToken = false;
    }
  }
  return response;
}

// ... (keep chromeExtensionStorageAdapter and TODOs for now, they might be relevant for token storage later) ...

const chromeExtensionStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    return new Promise((resolve) => {
      // @ts-ignore
      chrome.storage.local.get([key], (result) => {
        resolve(result[key] || null);
      });
    });
  },
  setItem: async (key: string, value: string): Promise<void> => {
    return new Promise((resolve) => {
      // @ts-ignore
      chrome.storage.local.set({ [key]: value }, () => {
        resolve();
      });
    });
  },
  removeItem: async (key: string): Promise<void> => {
    return new Promise((resolve) => {
      // @ts-ignore
      chrome.storage.local.remove([key], () => {
        resolve();
      });
    });
  },
};

// TODO: Implement PKCE for getAuthorizationUrl and exchangeCodeForToken.
// TODO: Provide a mechanism for refreshing tokens using a refresh_token.
// TODO: Consider a more robust token storage mechanism (e.g., using the chromeExtensionStorageAdapter or allowing a custom adapter).
// TODO: Add JSDoc comments for all new/modified exported functions and interfaces.
// TODO: Review error handling and provide more specific error types.
// TODO: Re-evaluate if any direct Supabase client interactions are needed or if all user-specific data comes via proxied API calls.

export async function getUserProfile<T = any>(): Promise<T> {
  ensureSdkInitialized();
  if (!baseApiUrl) {
    throw new Error('SDK not initialized with baseApiUrl. Cannot fetch user profile.');
  }

  const profileUrl = `${baseApiUrl.replace(/\/+$/, '')}${USER_PROFILE_PATH}`;

  console.log(`DFDA SDK: Fetching user profile from ${profileUrl}`);
  
  const response = await authenticatedFetch(profileUrl, {
    method: 'GET',
    headers: {
      // APIKey might still be required by Supabase /auth/v1/user endpoint 
      // even if Authorization: Bearer is present for the user session token.
      // This depends on your Supabase project's API settings.
      // If your proxy or Supabase instance doesn't need anon key for this when a user token is present, 
      // this can be removed or made conditional.
      // 'apikey': platformAnonKey!, // platformAnonKey would need to be stored from init options
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to fetch user profile with status: ' + response.status }));
    console.error('DFDA SDK: Get user profile error:', errorData, 'Status:', response.status);
    throw new Error(errorData.message || `Failed to fetch user profile: ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

// --- No longer needed: Old Supabase-specific functions ---
// The SDK has been refactored to be an OAuth 2.0 client and interact with a generic API proxy.
// Direct Supabase client initialization and Supabase-specific auth methods are no longer part of this SDK's core.

/*
export function createSupabaseClient() {
    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase URL or Anon Key is not initialized. Call initDfdaSdk first.');
    }
    return createClient(supabaseUrl, supabaseAnonKey);
}
*/

/*
export async function loginWithProvider(provider: 'github' | 'google', options?: { redirectTo?: string }): Promise<void> {
    const supabaseClient = ensureSdkInitialized();
    const { error } = await supabaseClient.auth.signInWithOAuth({
        provider,
        options: {
            redirectTo: options?.redirectTo || window.location.origin,
        },
    });
    if (error) {
        console.error('Error logging in with provider:', error);
        throw error;
    }
}
*/

/*
export async function getSession(): Promise<Session | null> {
    const supabaseClient = ensureSdkInitialized();
    const { data, error } = await supabaseClient.auth.getSession();
    if (error) {
        console.error('Error getting session:', error);
        // Don't throw, allow returning null if session fetch fails
    }
    return data.session;
}
*/

/*
export async function getUser(): Promise<User | null> {
    const supabaseClient = ensureSdkInitialized();
    const { data: { user } , error } = await supabaseClient.auth.getUser();
    if (error) {
        console.error('Error getting user:', error);
    }
    return user;
}
*/

/*
export function onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void): Subscription | null {
    const supabaseClient = ensureSdkInitialized();
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChanged(callback);
    return subscription;
}
*/

// Ensure any other direct Supabase client usage or types are removed if they are not part of the new OAuth flow.
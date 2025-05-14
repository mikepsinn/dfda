// E:/code/decentralized-fda/apps/dfda-node/sdks/dfda-auth-sdk.ts
import { createClient, SupabaseClient, Session, User, AuthChangeEvent, Subscription } from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;
let clientRedirectUri: string | null = null; 
let baseApiUrl: string | null = null; // New: For the Next.js API proxy

export interface DfdaSdkOptions {
  supabaseUrl: string;
  supabaseAnonKey: string;
  /**
   * The URI to redirect the client to after authentication.
   * For Chrome Extensions, this would be like 'chrome-extension://<YOUR_EXTENSION_ID>/callback.html'
   * For web apps, this would be like 'https://your-app.com/auth/callback'
   */
  clientRedirectUri: string;
  /**
   * The base URL of your DFDA Next.js API proxy.
   * e.g., 'https://your-app.com/api/supabase' or 'http://localhost:3000/api/supabase'
   */
  baseApiUrl: string; 
}

function ensureSdkInitialized(): SupabaseClient {
  if (!supabase || !baseApiUrl) { // Check baseApiUrl as well
    throw new Error('DFDA SDK not initialized or baseApiUrl not set. Call initDfdaSdk first.');
  }
  return supabase;
}

export function initDfdaSdk(options: DfdaSdkOptions): void {
  if (!options.supabaseUrl || !options.supabaseAnonKey) {
    throw new Error('Supabase URL and Anon Key are required for SDK initialization.');
  }
  if (!options.clientRedirectUri) {
    throw new Error('Client redirect URI is required for SDK initialization.');
  }
  if (!options.baseApiUrl) { // New check
    throw new Error('Base API URL (baseApiUrl) is required for SDK initialization.');
  }
  if (supabase) {
    console.warn('DFDA SDK already initialized. Re-initializing.');
  }

  supabase = createClient(options.supabaseUrl, options.supabaseAnonKey, {
    auth: {
      // Supabase-js typically handles storage automatically (localStorage by default).
      // For Chrome extensions, you might need to provide a custom storage adapter
      // if chrome.storage.local is preferred for security/persistence reasons.
      // Example: storage: chromeExtensionStorageAdapter, 
      autoRefreshToken: true,
      persistSession: true,
      // detectSessionInUrl: true // Handled by onAuthStateChange or manual call after redirect
    }
  });
  clientRedirectUri = options.clientRedirectUri;
  baseApiUrl = options.baseApiUrl.replace(/\/$/, ''); // Remove trailing slash if present
  
  // Optional: Log SDK initialization
  console.log('DFDA SDK Initialized.', { baseApiUrl });

  // Listen to auth state changes to handle redirects and session updates automatically.
  // This is crucial for the OAuth flow to complete after redirecting back from Supabase.
  supabase.auth.onAuthStateChange((event, session) => {
    // This callback will be triggered after the user is redirected back from Supabase
    // and Supabase client processes the URL hash for tokens.
    console.log('DFDA SDK: Auth state change detected.', { event, session });

    // If the event is SIGNED_IN and there's a session, the login was successful.
    // The client application can use its own onAuthStateChange listener (exposed below)
    // to react to this.
  });
}

export async function loginWithProvider(provider: 'google' | 'github' /* add more as needed */): Promise<void> {
  const supabaseClient = ensureSdkInitialized();
  if (!clientRedirectUri) { // Should be set during init
      throw new Error('Client redirect URI not configured during SDK initialization.');
  }
  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: provider,
    options: {
      redirectTo: clientRedirectUri,
      // PKCE is handled automatically by supabase-js v2+
    },
  });
  if (error) {
    console.error(`Error during ${provider} login redirect:`, error);
    throw error;
  }
  // The browser will redirect to Supabase, then back to clientRedirectUri
}

export async function logout(): Promise<void> {
  const supabaseClient = ensureSdkInitialized();
  const { error } = await supabaseClient.auth.signOut();
  if (error) {
    console.error('Error during logout:', error);
    throw error;
  }
  console.log('DFDA SDK: User logged out.');
}

export async function getSession(): Promise<Session | null> {
  const supabaseClient = ensureSdkInitialized();
  const { data, error } = await supabaseClient.auth.getSession();
  if (error) {
    console.error('Error getting session:', error);
    // Depending on desired strictness, you might throw or just return null
    return null; 
  }
  return data.session;
}

export async function getUser(): Promise<User | null> {
  const supabaseClient = ensureSdkInitialized();
  const { data, error } = await supabaseClient.auth.getUser();
   if (error) {
    console.error('Error getting user:', error);
    // Depending on desired strictness, you might throw or just return null
    return null;
  }
  return data.user;
}

/**
 * Allows the client application to subscribe to authentication state changes.
 * This is a wrapper around Supabase's onAuthStateChange.
 * @param callback (event: AuthChangeEvent, session: Session | null) => void
 * @returns A subscription object, which has an `unsubscribe` method.
 */
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

export async function authenticatedFetch(
  apiPath: string, // Now represents the path *after* baseApiUrl, e.g., 'studies' or 'rpc/submit_data'
  fetchOptions: RequestInit = {}
): Promise<Response> {
  const supabaseClient = ensureSdkInitialized(); // ensureSdkInitialized also checks for baseApiUrl
  const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
  
  if (sessionError) {
    console.error('Error retrieving session for authenticated fetch:', sessionError);
    throw new Error('Could not retrieve session for authenticated request.');
  }

  const token = session?.access_token;

  if (!token) {
    // This could mean the user is not logged in, or the session is invalid.
    // The client app should ideally handle this by prompting for login.
    throw new Error('Not authenticated or session expired. Please login.');
  }

  const headers = new Headers(fetchOptions.headers);
  headers.set('Authorization', `Bearer ${token}`);
  // It's good practice to set Content-Type if sending a body, e.g., for POST/PUT
  if (fetchOptions.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json'); 
  }

  // Construct the full URL using the configured baseApiUrl and the provided apiPath
  // Ensure apiPath doesn't start with a slash if baseApiUrl doesn't end with one, or vice-versa
  const fullApiUrl = `${baseApiUrl}/${apiPath.replace(/^\//, '')}`; // Remove leading slash from apiPath

  console.log(`DFDA SDK: authenticatedFetch to ${fullApiUrl}`);

  return fetch(fullApiUrl, {
    ...fetchOptions,
    headers,
  });
}

/*
// Example for Chrome Extension Specific Storage (if localStorage is not ideal)
// This would need to be implemented carefully.
const chromeExtensionStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (result) => {
        resolve(result[key] || null);
      });
    });
  },
  setItem: async (key: string, value: string): Promise<void> => {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, () => {
        resolve();
      });
    });
  },
  removeItem: async (key: string): Promise<void> => {
    return new Promise((resolve) => {
      chrome.storage.local.remove([key], () => {
        resolve();
      });
    });
  },
};
*/

// TODO: Consider how this SDK will be built and distributed (e.g., as an npm package, or directly included).
// TODO: Add more specific error types or error handling strategies.
// TODO: Add JSDoc comments for all exported functions and interfaces. 

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

// TODO: Consider how this SDK will be built and distributed (e.g., as an npm package, or directly included).
// TODO: Add more specific error types or error handling strategies.
// TODO: Add JSDoc comments for all exported functions and interfaces. 
// TODO: Potentially rename this file to dfda-sdk.ts or similar if it grows.
// TODO: Allow passing custom storage adapter to initDfdaSdk for Chrome extensions. 
import { headers } from 'next/headers';

/**
 * Gets the base URL for the current environment.
 * Prioritizes Vercel/Netlify env vars, then NEXT_PUBLIC_SITE_URL, falling back to localhost.
 * Ensures HTTPS unless localhost and includes a trailing slash.
 */
export function getBaseUrl(): string {
  // 1. Vercel deployment URL
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    // Vercel URL includes the protocol
    const url = process.env.NEXT_PUBLIC_VERCEL_URL.startsWith('http') 
      ? process.env.NEXT_PUBLIC_VERCEL_URL 
      : `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
    return url.endsWith('/') ? url : `${url}/`;
  }
  
  // 2. Netlify deployment URL (Using standard DEPLOY_PRIME_URL)
  if (process.env.DEPLOY_PRIME_URL) { // Standard Netlify var for primary deploy URL
    const url = process.env.DEPLOY_PRIME_URL;
    // Netlify URLs might not include protocol in this var, assume https
    return url.endsWith('/') ? url : `${url}/`; 
  }

  // 3. Explicit Site URL (for production or stable environments)
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    let url = process.env.NEXT_PUBLIC_SITE_URL;
    url = url.startsWith('http') ? url : `https://${url}`; // Assume https if protocol missing
    return url.endsWith('/') ? url : `${url}/`; // Ensure trailing slash
  }
  
  // 4. Fallback for local development
  return 'http://localhost:3000/';
}

/**
 * Constructs the full URL for a specific authentication callback path.
 * Ensures consistency by removing trailing slash from base and adding leading slash to path.
 * @param path - The path relative to the base URL (e.g., '/auth/callback')
 */
export function getCallbackUrl(path: string = '/auth/callback'): string {
  const baseUrl = getBaseUrl();
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${cleanBaseUrl}${cleanPath}`;
}

/**
 * Gets the current origin (protocol + hostname + port) for the request.
 * Works on both client and server.
 * - Client-side: Uses `window.location.origin`.
 * - Server-side: Attempts to use request headers (`x-forwarded-host`, `host`, `x-forwarded-proto`).
 *   Falls back to `getBaseUrl()` if headers are unavailable or don't provide host information.
 * @returns The origin string (e.g., "https://myapp.com", "http://localhost:3000"), without a trailing slash.
 */
export async function getCurrentOrigin(): Promise<string> {
  if (typeof window !== 'undefined') {
    // Client-side
    return window.location.origin;
  }

  // Server-side
  try {
    const headersList = headers();
    // Await the headers promise
    const resolvedHeaders = await headersList; 
    // Prefer X-Forwarded-Host if available (common behind proxies), else use Host
    const host = resolvedHeaders.get('x-forwarded-host') ?? resolvedHeaders.get('host');
    // Prefer X-Forwarded-Proto if available, else default to http (adjust if needed)
    const protocol = resolvedHeaders.get('x-forwarded-proto') ?? 'http';

    if (host) {
      return `${protocol}://${host}`;
    }

    // If headers didn't provide a host, fall back to configured base URL
    console.warn("getCurrentOrigin: Host header missing on server, falling back to getBaseUrl()");
    const baseUrl = getBaseUrl();
    // getBaseUrl includes a trailing slash, remove it for origin consistency
    return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

  } catch (error) {
    // This might happen if headers() is called in an unsupported server context (e.g., during build)
    console.error("getCurrentOrigin: Failed to get headers on server, falling back to getBaseUrl():", error);
    const baseUrl = getBaseUrl();
    // getBaseUrl includes a trailing slash, remove it for origin consistency
    return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  }
} 
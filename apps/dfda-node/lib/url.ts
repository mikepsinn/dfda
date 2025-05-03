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
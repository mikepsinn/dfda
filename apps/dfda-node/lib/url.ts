/**
 * Gets the base URL for the current environment.
 * Prioritizes the canonical site URL, then provider-specific deployment URLs,
 * falling back to localhost.
 * Ensures HTTPS unless localhost and includes a trailing slash.
 */
function normalizeHostedUrl(value: string): string {
  const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
  const isLocalhost = ['localhost', '127.0.0.1', '::1'].includes(url.hostname);

  if (url.protocol === 'http:' && !isLocalhost) {
    url.protocol = 'https:';
  }

  if (!url.pathname.endsWith('/')) {
    url.pathname = `${url.pathname}/`;
  }

  return url.toString();
}

export function getBaseUrl(): string {
  // 1. Explicit site URL keeps production auth callbacks on the canonical domain.
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return normalizeHostedUrl(process.env.NEXT_PUBLIC_SITE_URL);
  }

  // 2. Vercel deployment URL
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return normalizeHostedUrl(process.env.NEXT_PUBLIC_VERCEL_URL);
  }

  // 3. Netlify deployment URL (using standard DEPLOY_PRIME_URL)
  if (process.env.DEPLOY_PRIME_URL) {
    return normalizeHostedUrl(process.env.DEPLOY_PRIME_URL);
  }

  // 4. Fallback for local development
  return 'http://localhost:3000/';
}

/**
 * Constructs the full URL for a specific authentication callback path.
 * Ensures consistency by removing trailing slash from base and adding leading slash to path.
 * @param path - The path relative to the base URL (e.g., '/auth/callback' or '/update-password')
 */
export function getCallbackUrl(path: string = '/auth/callback'): string {
  const baseUrl = getBaseUrl();
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${cleanBaseUrl}${cleanPath}`;
}

// REMOVED getCurrentOrigin function

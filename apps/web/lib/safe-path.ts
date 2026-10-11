/**
 * `value` when it is a path on this site, else null. Used for `next` links
 * after sign-in or a preview, so they cannot send the browser to another
 * host. Browsers read "/\evil.com" as "//evil.com", so backslashes are refused too.
 */
export function safeLocalPath(value: string | null | undefined): string | null {
  if (!value || value.length > 2000 || !value.startsWith('/') || value.startsWith('//')) return null
  if (/[\\\u0000-\u001f\u007f]/.test(value)) return null
  const base = 'http://local.invalid'
  try {
    const url = new URL(value, base)
    return url.origin === base ? `${url.pathname}${url.search}${url.hash}` : null
  } catch {
    return null
  }
}

/**
 * The page to go back to after a form, from its `returnTo` search parameter:
 * a path of the patient app, else `fallback`. Other values are ignored, so a
 * link cannot send the person to another site.
 */
export function returnPath(value: string | string[] | undefined, fallback: string): string {
  const path = Array.isArray(value) ? value[0] : value
  if (!path || !/^\/patient(?:[/?#]|$)/.test(path) || path.includes('//') || /\\/.test(path)) return fallback
  return path
}

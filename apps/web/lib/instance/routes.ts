/**
 * The paths that a company instance serves, on its own domain, its subdomain
 * or the preview link. The other paths are the network's own site (rankings,
 * trials, Outcome Labels, role dashboards). The middleware gives 404 for them
 * on an instance, so the company's customers see only the company's site.
 */
const INSTANCE_PATHS = [
  // The company's programs, and each member's own program page
  '/programs',
  // Biomarker reports
  '/reports',
  // Sign-in
  '/login',
  '/register',
  '/forgot-password',
  '/update-password',
  '/auth',
  // A member's reminder times; the program page links to them
  '/patient/reminders',
  '/terms',
  '/privacy',
  // The owner's pages and the preview link, also while the owner previews the site
  '/instances',
  '/i',
  // Care team invitations, for a clinician who also visited the company's site
  '/care-teams',
  // APIs, OAuth and well-known files
  '/api',
  '/oauth',
  '/.well-known',
]

export function isInstancePath(pathname: string): boolean {
  if (pathname === '/') return true
  // Files (images, videos, scripts) and the framework's own paths
  if (pathname.startsWith('/_next/') || /\.[a-z0-9]+$/i.test(pathname.slice(pathname.lastIndexOf('/')))) return true
  return INSTANCE_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}

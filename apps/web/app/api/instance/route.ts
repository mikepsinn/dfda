import { resolveInstance } from '@/lib/instance/resolve'

// Which company's site this host serves: the slug of its instance, or null on
// the network's own site. isDomainConfigured (lib/instance/vercel-domains.ts)
// asks a company's own domain for it, to confirm that the domain serves this
// app for that company. The slug is public: it is in the preview link.
export async function GET() {
  const instance = await resolveInstance()
  return Response.json({ slug: instance?.slug ?? null }, { headers: { 'Cache-Control': 'no-store' } })
}

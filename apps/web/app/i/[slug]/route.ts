import { NextResponse } from 'next/server'
import { dbAs } from '@/lib/db'
import { PREVIEW_COOKIE } from '@/lib/instance/resolve'
import { safeLocalPath } from '@/lib/safe-path'

// The preview link of a company instance: this browser sees the site with the
// instance's branding until it opens /i. It works on any host, with no DNS.
export async function GET(req: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params
  const url = new URL(req.url)
  const instance = await dbAs(null).instances.findUnique({ where: { slug }, select: { slug: true } })
  if (!instance) return NextResponse.redirect(new URL('/', url))
  // Only a path on this site, never another host.
  const target = safeLocalPath(url.searchParams.get('next')) ?? '/'
  const response = NextResponse.redirect(new URL(target, url))
  response.cookies.set(PREVIEW_COOKIE, instance.slug, { path: '/', sameSite: 'lax', httpOnly: true, maxAge: 60 * 60 * 24 })
  return response
}

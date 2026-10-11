import { NextResponse } from 'next/server'
import { PREVIEW_COOKIE } from '@/lib/instance/resolve'

// Ends an instance preview: the site shows its own branding again.
export function GET(req: Request) {
  const response = NextResponse.redirect(new URL('/', req.url))
  response.cookies.delete(PREVIEW_COOKIE)
  return response
}

import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { withAuth } from "next-auth/middleware"


// Define redirects with string literals
const redirects = [
  {
    source: "/dfda/right-to-trial",
    destination: "/docs/disease-eradication-act",
    permanent: true,
    description: "Redirect to new name of the Right to Trial Act",
  },
  {
    source: "/dfda/right-to-trial-act",
    destination: "/docs/disease-eradication-act",
    permanent: true,
    description: "Redirect to new name of the Right to Trial Act",
  },
  {
    source: "/dfda/health-savings-sharing",
    destination: "/docs/health-savings-sharing",
    permanent: true,
    description: "Redirect to health savings sharing documentation",
  },
  {
    source: "/cure-acceleration-act",
    destination: "/docs/disease-eradication-act",
    permanent: true,
    description: "Redirect to Disease Eradication Act",
  },
  {
    source: "/docs/disease-eradication-act-summary",
    destination: "/docs/disease-eradication-act",
    permanent: true,
    description: "Redirect to Disease Eradication Act Summary",
  }
  // Add more redirects here
  // Make sure to add the source path to the matcher array below 👇
] as const

export default withAuth(
  async function middleware(req) {
    const token = await getToken({ req })
    const isAuth = !!token
    const pathname = req.nextUrl.pathname

    // Handle /dfda path (with or without trailing slash)
    if (pathname === '/dfda' || pathname === '/dfda/') {
      const newUrl = new URL('/', req.url)
      // Preserve query parameters
      const searchParams = new URLSearchParams(req.nextUrl.search)
      searchParams.forEach((value, key) => {
        newUrl.searchParams.set(key, value)
      })
      // Preserve hash fragment
      if (req.nextUrl.hash) {
        newUrl.hash = req.nextUrl.hash
      }
      return NextResponse.redirect(newUrl, { status: 308 })
    }

    // Handle /dfda/ prefix redirects
    if (pathname.startsWith('/dfda/')) {
      const newPath = pathname.replace('/dfda/', '/')
      const newUrl = new URL(newPath, req.url)
      
      // Preserve query parameters
      const searchParams = new URLSearchParams(req.nextUrl.search)
      searchParams.forEach((value, key) => {
        newUrl.searchParams.set(key, value)
      })

      // Preserve hash fragment
      if (req.nextUrl.hash) {
        newUrl.hash = req.nextUrl.hash
      }

      return NextResponse.redirect(newUrl, { status: 308 })
    }

    // Check redirects first
    const redirect = redirects.find(r => r.source === pathname)
    if (redirect) {
      const newUrl = new URL(redirect.destination, req.url)
      
      // Preserve query parameters
      const searchParams = new URLSearchParams(req.nextUrl.search)
      searchParams.forEach((value, key) => {
        newUrl.searchParams.set(key, value)
      })

      // Preserve hash fragment
      if (req.nextUrl.hash) {
        newUrl.hash = req.nextUrl.hash
      }

      return NextResponse.redirect(
        newUrl,
        redirect.permanent ? { status: 308 } : { status: 307 }
      )
    }


    return null
  },
  {
    callbacks: {
      async authorized() {
        return true
      },
    },
  }
)

// IMPORTANT: When adding new redirects above☝️, add the source path here too 👇
export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/signin",
    "/signup",
    "/dfda",
    "/dfda/:path*",
    "/cure-acceleration-act",
    "/right-to-trial-act",
    "/docs/disease-eradication-act-summary"
  ],
}

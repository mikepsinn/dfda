import type React from "react"
import type { Metadata } from "next"
import { Inter, Source_Serif_4 } from "next/font/google"
import "./globals.css"
import { ScrollToHashElement } from "@/components/ScrollToHashElement"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { SiteChrome } from "@/components/SiteChrome"
import { Toaster } from "@/components/ui/toaster"
import { getServerUser } from "@/lib/server-auth"
import { getProfileByIdAction } from "../lib/actions/profiles"
import type { Profile } from "../lib/actions/profiles"
import { env } from "@/lib/env"
import { TooltipProvider } from "@/components/ui/tooltip"
import { InstanceTheme } from "@/components/instance/InstanceTheme"
import { InstanceHeader } from "@/components/instance/InstanceHeader"
import { InstanceFooter } from "@/components/instance/InstanceFooter"
import { PreviewBar } from "@/components/instance/PreviewBar"
import { listPages } from "@/lib/instance/page-data"
import { requestSiteOrigin, resolveInstance } from "@/lib/instance/resolve"
import { DARK_CLASS, isDark } from "@/lib/instance/theme"
import { cn } from "@/lib/utils"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
// The headings of biomarker reports (app/globals.css). Not preloaded: only report pages use it.
const reportSerif = Source_Serif_4({ subsets: ["latin"], variable: "--font-report-serif", weight: ["500"], preload: false })

const baseMetadata: Metadata = {
  title: env.NEXT_PUBLIC_SITE_NAME,
  description: env.NEXT_PUBLIC_SITE_DESCRIPTION,
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
  keywords: [
    "clinical trials",
    "decentralized",
    "FDA",
    "healthcare",
    "medical research",
    "patient trials",
    "medical studies"
  ],
  authors: [{ name: env.NEXT_PUBLIC_SITE_NAME }],
  icons: { icon: "/icon.svg", apple: "/apple-icon.png" },
  // OpenGraph metadata for social media sharing. The image is app/share-image.png/route.tsx.
  openGraph: {
    title: `${env.NEXT_PUBLIC_SITE_NAME} - Decentralized Clinical Trials`,
    description: env.NEXT_PUBLIC_SITE_DESCRIPTION,
    url: env.NEXT_PUBLIC_SITE_URL,
    siteName: env.NEXT_PUBLIC_SITE_NAME,
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/share-image.png",
        width: 1200,
        height: 630,
        alt: `${env.NEXT_PUBLIC_SITE_NAME} - Decentralized Clinical Trials Platform`
      }
    ]
  },
  // Twitter Card metadata for Twitter sharing, with the same image.
  twitter: {
    card: "summary_large_image",
    title: `${env.NEXT_PUBLIC_SITE_NAME} - Decentralized Clinical Trials`,
    description: env.NEXT_PUBLIC_SITE_DESCRIPTION,
    images: ["/share-image.png"],
    creator: env.NEXT_PUBLIC_TWITTER_HANDLE
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
  },
}

// A company's site is the company's own: its name, tagline, icon and link
// preview, with nothing of the network (no author, keywords, Twitter account or
// site verification). On its own domain or subdomain, links in the metadata
// use that host, so that previews load the company's image.
export async function generateMetadata(): Promise<Metadata> {
  const instance = await resolveInstance()
  if (!instance) return baseMetadata
  const origin = instance.via === "preview" ? null : await requestSiteOrigin()
  const description = instance.tagline ?? undefined
  const image = { url: "/share-image.png", width: 1200, height: 630, alt: instance.name }
  const icon = instance.logoUrl ?? "/site-icon.png"
  return {
    metadataBase: origin ? new URL(origin) : baseMetadata.metadataBase,
    title: instance.name,
    description,
    icons: { icon, apple: icon },
    openGraph: { title: instance.name, description, url: origin ?? undefined, siteName: instance.name, locale: "en_US", type: "website", images: [image] },
    twitter: { card: "summary_large_image", title: instance.name, description, images: [image.url] },
    // The preview link is for the company itself; search engines should find its own address.
    robots: instance.via === "preview" ? { index: false, follow: false } : baseMetadata.robots,
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const user = await getServerUser()
  let profile: Profile | null = null

  if (user) {
    profile = await getProfileByIdAction(user.id)
  }
  // A company instance (its own domain, subdomain or preview link) is the company's own site:
  // its branding, header and footer, and only its pages (lib/instance/routes.ts).
  const instance = await resolveInstance()
  // Its content pages, linked in its header and footer.
  const pages = instance ? (await listPages(instance.slug)).map(({ slug, title, inMenu }) => ({ slug, title, inMenu })) : []

  return (
    <html lang="en" className={cn(inter.variable, reportSerif.variable, instance && isDark(instance.backgroundColor) && DARK_CLASS)}>
      {/* An instance sets its font in InstanceTheme. */}
      <body className={instance ? undefined : inter.className}>
        {instance && <InstanceTheme theme={instance} />}
        {instance?.via === "preview" && <PreviewBar name={instance.name} />}
        <TooltipProvider>
          <ScrollToHashElement />
          <SiteChrome
            header={
              instance ? (
                <InstanceHeader brand={instance} pages={pages} initialUser={user} initialProfile={profile} />
              ) : (
                <Header initialUser={user} initialProfile={profile} siteName={env.NEXT_PUBLIC_SITE_NAME} />
              )
            }
            footer={
              instance ? (
                <InstanceFooter brand={instance} pages={pages} />
              ) : (
                <Footer siteName={env.NEXT_PUBLIC_SITE_NAME} />
              )
            }
          >
            {children}
          </SiteChrome>
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  )
}



import './globals.css'

import "./globals.css";
import "@/app/styles/neobrutalist.css";

import { Metadata, Viewport } from "next";
import { Space_Grotesk } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import NextTopLoader from "nextjs-toploader";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/app/providers";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "700"]
})

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url.base),
  title: {
    default: "FDAI Chat",
    template: `%s | FDAI Chat`,
  },
  description: "AI Assistant for FDA DAO",
  keywords: ["FDA", "DAO", "AI", "Chat"],
  authors: [
    {
      name: siteConfig.author,
      url: siteConfig.url.author,
    },
  ],
  creator: siteConfig.author,
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url.base,
    title: "FDAI Chat",
    description: "AI Assistant for FDA DAO",
    siteName: "FDAI Chat",
  },
  twitter: {
    card: "summary_large_image",
    title: "FDAI Chat",
    description: "AI Assistant for FDA DAO",
    creator: "@FDADAO",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default async function FDAILayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("antialiased", spaceGrotesk.className)}>
        <Providers>
          <NextTopLoader color="#DC2645" height={2.5} showSpinner={false}/>
          <div className="flex min-h-screen flex-col bg-background">
            <main className="flex-1">{children}</main>
          </div>
          <Toaster/>
          <Analytics/>
        </Providers>
      </body>
    </html>
  );
}

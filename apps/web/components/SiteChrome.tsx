"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"

// The site header, page container and footer, left out on full-screen presentations (/present).
export function SiteChrome({ header, footer, children }: { header: ReactNode; footer: ReactNode; children: ReactNode }) {
  const pathname = usePathname()
  if (pathname?.startsWith("/present/")) return <>{children}</>
  return (
    <div className="min-h-screen flex flex-col">
      {header}
      <main className="flex-1 py-6 md:py-10 w-full bg-background">
        <div className="container px-4 md:px-6 mx-auto">
          {children}
        </div>
      </main>
      {footer}
    </div>
  )
}

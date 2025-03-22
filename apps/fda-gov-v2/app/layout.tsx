import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ScrollToHashElement } from "@/components/ScrollToHashElement"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { cn } from "@/lib/utils"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "FDA.gov v2",
  description: "Revolutionizing Clinical Trials Through Decentralization",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={cn(
        "min-h-screen bg-background font-sans antialiased",
        inter.className
      )}>
        <ScrollToHashElement />
        <Header />
        <div className="relative flex min-h-screen flex-col">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  )
}


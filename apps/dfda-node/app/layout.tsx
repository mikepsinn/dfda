import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ScrollToHashElement } from "@/components/ScrollToHashElement"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { getServerUser } from "@/lib/server-auth"
import { getProfileByIdAction } from "../lib/actions/profiles"
import type { Profile } from "../lib/actions/profiles"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "FDA.gov v2",
  description: "Revolutionizing Clinical Trials Through Decentralization",
    generator: 'v0.dev'
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

  return (
    <html lang="en">
      <body className={inter.className}>
        <ScrollToHashElement />
        <div className="min-h-screen flex flex-col">
          <Header initialUser={user} initialProfile={profile} />
          <main className="flex-1 py-6 md:py-10 w-full bg-background">
            <div className="container px-4 md:px-6 mx-auto">
              {children}
            </div>
          </main>
          <Footer />
        </div>
      </body>
    </html>
  )
}



import './globals.css'
import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ScrollToHashElement } from "@/components/ScrollToHashElement"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "FDA.gov v2",
  description: "Revolutionizing Clinical Trials Through Decentralization",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ScrollToHashElement />
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  )
}



import './globals.css'
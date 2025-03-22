import { Metadata } from "next"

export const metadata: Metadata = {
  title: {
    default: "FDA Gov",
    template: "%s"
  },
  description: "A decentralized FDA platform",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
} 
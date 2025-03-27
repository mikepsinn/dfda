import type React from "react"
import { getServerUser } from "@/lib/server-auth"
import { redirect } from "next/navigation"

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getServerUser()

  if (!user) {
    redirect("/login")
  }

  return <div className="min-h-screen flex flex-col">{children}</div>
}


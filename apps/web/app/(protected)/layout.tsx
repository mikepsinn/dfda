import type React from "react"
import { getServerUser } from "@/lib/server-auth"
import { redirect } from "next/navigation"
import { logger } from "@/lib/logger"

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getServerUser()
  logger.debug("ProtectedLayout - getServerUser returned", { user });

  if (!user) {
    logger.info("ProtectedLayout - no user, redirecting to /login");
    redirect("/login")
  }
  logger.info("ProtectedLayout - user present, proceeding with layout");

  // Just return children - layout handled by root layout
  return children
}

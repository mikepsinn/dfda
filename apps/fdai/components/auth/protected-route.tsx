"use client"

import type React from "react"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

// Import useAuth with a try/catch to handle the case when it's used outside an AuthProvider
let useAuth: any
try {
  useAuth = require("@/contexts/auth-context").useAuth
} catch (error) {
  console.error("Failed to import useAuth:", error)
  useAuth = () => ({ user: null, isLoading: true, session: null })
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false)
  const router = useRouter()
  const { user, isLoading, session } = useAuth() // Call useAuth unconditionally

  // Only use auth on the client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  // If we're not on the client yet, show a loading state
  if (!isClient) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p>Initializing authentication...</p>
        </div>
      </div>
    )
  }

  // Now that we're on the client, we can safely use the auth hook
  // const { user, isLoading, session } = useAuth()

  useEffect(() => {
    // Enhanced console logging for authentication debugging
    if (process.env.NODE_ENV === "development") {
      console.group("🔒 Auth Debug")
      console.log("Protected route state:", {
        user: user
          ? {
              id: user.id,
              email: user.email,
              emailVerified: user.email_confirmed_at ? true : false,
            }
          : null,
        isLoading,
        hasSession: !!session,
        timestamp: new Date().toISOString(),
      })
      console.groupEnd()
    }

    // Only redirect if not authenticated and not loading
    if (!isLoading && !user) {
      console.log("🔒 Auth: Redirecting to auth page - User not authenticated")
      router.push("/auth")
    }
  }, [user, isLoading, router, session])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p>Loading authentication state...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    // Simple loading state when not authenticated
    return null
  }

  // Just return children when authenticated
  return <>{children}</>
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { demoLogin } from "@/app/actions/demo-login"
import { useRouter } from "next/navigation"

export function DemoLoginButton() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleDemoLogin = async () => {
    try {
      console.log('[DEMO-BUTTON] Starting demo login process');
      setIsLoading(true)
      
      console.log('[DEMO-BUTTON] Calling demo login action');
      await demoLogin("patient")
      
      // We won't actually reach here because of the redirect
    } catch (error) {
      // Ignore Next.js redirect "errors" as they're actually successful redirects
      if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
        console.log('[DEMO-BUTTON] Redirect successful');
        return;
      }
      
      console.error("[DEMO-BUTTON] Demo login error:", {
        error: error instanceof Error ? error.message : error
      })
      // Show error toast or message
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleDemoLogin}
      disabled={isLoading}
    >
      {isLoading ? "Logging in..." : "Try Demo"}
    </Button>
  )
} 
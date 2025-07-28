"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowRight } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"

interface DemoLoginButtonProps {
  onError: (error: string, type?: string) => void
}

export function DemoLoginButton({ onError }: DemoLoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { signInWithPassword, signUp } = useAuth()
  const router = useRouter()

  const handleDemoLogin = async () => {
    setIsLoading(true)

    try {
      // Demo account credentials
      const demoEmail = "fdai-demo@dfda.earth"
      const demoPassword = "demo123" // This should be your actual demo password in Supabase

      console.log("Attempting to sign in with demo account")

      const { error, user } = await signInWithPassword(demoEmail, demoPassword)

      if (error) {
        console.error("Demo login failed:", error)

        // Check if this is an email confirmation error
        if (error.message.includes("Email not confirmed")) {
          onError(error.message, "email_not_confirmed")
          setIsLoading(false)
          return
        }

        // If login fails, try to sign up the demo account
        if (error.message.includes("Invalid login credentials")) {
          console.log("Attempting to sign up demo account")
          const signUpResult = await signUp(demoEmail, demoPassword)

          if (signUpResult.error) {
            console.error("Demo sign up failed:", signUpResult.error)
            onError(`Demo account setup failed: ${signUpResult.error.message}`, "general")
          } else {
            console.log("Demo account created successfully")
            router.push("/")
          }
        } else {
          onError(`Demo login failed: ${error.message}`, "general")
        }
      } else {
        console.log("Demo login successful:", user)
        router.push("/")
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Unknown error"
      console.error("Unexpected error during demo login:", e)
      onError(`Demo login error: ${errorMessage}`, "general")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      type="button"
      className="w-full bg-green-600 hover:bg-green-700 text-white"
      onClick={handleDemoLogin}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Logging in...
        </>
      ) : (
        <>
          Try Instant Demo
          <ArrowRight className="ml-2 h-4 w-4" />
        </>
      )}
    </Button>
  )
}

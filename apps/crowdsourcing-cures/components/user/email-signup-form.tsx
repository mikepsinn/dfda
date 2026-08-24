"use client"

import * as React from "react"
import { signIn } from "next-auth/react"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"
import { subscribeToNewsletter } from "@/app/emailActions"

interface EmailSignupFormProps extends React.HTMLAttributes<HTMLDivElement> {
  callbackUrl?: string
  onEmailSent?: () => void
  buttonText?: string
  placeholder?: string
  description?: string
}

export function EmailSignupForm({
  className,
  callbackUrl,
  onEmailSent,
  buttonText = "Sign in with Email",
  placeholder = "Enter your email",
  description,
  ...props
}: EmailSignupFormProps) {
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const [email, setEmail] = React.useState<string>("")
  const [emailSent, setEmailSent] = React.useState<boolean>(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleEmailSignIn = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // First subscribe to newsletter
      const subscribeResult = await subscribeToNewsletter(email)
      if (!subscribeResult.success) {
        throw new Error(subscribeResult.error)
      }

      // Then sign in
      const result = await signIn("email", {
        email,
        redirect: false,
        callbackUrl,
      })
      if (result?.error) {
        throw new Error(result.error)
      } else {
        setEmailSent(true)
        onEmailSent?.()
      }
    } catch (error) {
      console.error("Email sign-in error:", error)
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("mx-auto w-full max-w-sm", className)} {...props}>
      {emailSent ? (
        <div className="neobrutalist-gradient-container neobrutalist-gradient-green text-center">
          <div className="mb-2 text-xl font-black text-white">Email Sent! 📧</div>
          <div className="text-lg font-bold text-white/90">
            Check your email for a login link. You can close this window.
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {description && (
            <p className="text-sm font-bold text-gray-600 mb-2">{description}</p>
          )}
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="email"
              name="email"
              placeholder={placeholder}
              className="w-full rounded-xl border-4 border-black p-2 text-lg font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:translate-x-1 focus:translate-y-1 focus:shadow-none focus:outline-none transition-all bg-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
            <button
              type="button"
              className="group neobrutalist-button whitespace-nowrap"
              onClick={handleEmailSignIn}
              disabled={isLoading || !email}
            >
              {isLoading ? (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                buttonText
              )}
            </button>
          </div>
          {error && (
            <div className="neobrutalist-gradient-container neobrutalist-gradient-pink text-center mt-2">
              <p className="text-white font-bold">{error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 
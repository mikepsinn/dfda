"use client"

import { Button } from "@/components/ui/button"

interface EmailSentViewProps {
  email: string
  isSignup: boolean
  onReset: () => void
}

export function EmailSentView({ email, isSignup, onReset }: EmailSentViewProps) {
  return (
    <div className="text-center space-y-4">
      <div className="text-xl font-medium">Check your email</div>
      <p>
        We've sent a {isSignup ? "confirmation" : "magic"} link to <strong>{email}</strong>.
        {isSignup ? " Click the link in the email to verify your account." : " Click the link in the email to sign in."}
      </p>
      <Button variant="outline" className="mt-4" onClick={onReset}>
        Use a different email
      </Button>
    </div>
  )
}

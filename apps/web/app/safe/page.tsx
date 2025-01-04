import { redirect } from "next/navigation"

import { getSafeRedirectUrl } from "../dfdaActions"
import { getCurrentUser } from "@/lib/session"
import { LoginPromptButton } from "@/components/LoginPromptButton"
import { SafeLandingContent } from "@/components/safe/SafeLandingContent"

export default async function DfdaSafePage() {
  const session = await getCurrentUser()

  if (session) {
    const redirectUrl = await getSafeRedirectUrl(session.id)

    if (redirectUrl) {
      //redirect(redirectUrl)
    }
  }

  // If not logged in or no token, show login prompt
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <SafeLandingContent session={session} />
      <LoginPromptButton
        buttonText="Sign in to access your Digital Twin Safe"
        buttonVariant="neobrutalist"
        buttonSize="lg"
      />
    </div>
  )
}

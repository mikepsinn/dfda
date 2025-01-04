import { getSafeRedirectUrl } from "../dfdaActions"
import { LoginPromptButton } from "@/components/LoginPromptButton"
import { SafeLandingContent } from "@/components/safe/SafeLandingContent"
import { authOptions } from "@/lib/auth"
import { getServerSession } from "next-auth"

export default async function DfdaSafePage() {
  const session = await getServerSession(authOptions)

  if (session) {
    const redirectUrl = await getSafeRedirectUrl(session.user.id)

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

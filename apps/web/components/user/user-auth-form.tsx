"use client"

import * as React from "react"
import { signIn } from "next-auth/react"

import { cn } from "@/lib/utils"
import { Icons } from "@/components/icons"

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
  callbackUrl?: string
  onEmailSent?: () => void
}

export function UserAuthForm({
  className,
  callbackUrl,
  onEmailSent,
  ...props
}: UserAuthFormProps) {
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const [isGoogleLoading, setIsGoogleLoading] = React.useState<boolean>(false)
  const [isGithubLoading, setIsGithubLoading] = React.useState<boolean>(false)
  const [isEmailLoading, setIsEmailLoading] = React.useState<boolean>(false)
  const [email, setEmail] = React.useState<string>("")

  const [finalCallbackUrl, setFinalCallbackUrl] = React.useState<
    string | undefined
  >(callbackUrl)

  // Check for callbackUrl in the URL and set default if not found
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const urlCallbackUrl = urlParams.get("callbackUrl")
    if (urlCallbackUrl) {
      setFinalCallbackUrl(urlCallbackUrl)
    } else if (!finalCallbackUrl) {
      setFinalCallbackUrl(window.location.href)
    }

    // Check if the current URL is dfda.earth or localhost
    const currentHost = window.location.hostname
    setShowSocialLogins(
      currentHost === "dfda.earth" || currentHost === "localhost"
    )
  }, [finalCallbackUrl])

  const [emailSent, setEmailSent] = React.useState<boolean>(false)
  const [showSocialLogins, setShowSocialLogins] = React.useState<boolean>(false)

  const handleEmailSignIn = async () => {
    setIsEmailLoading(true)
    setIsLoading(true)
    try {
      const result = await signIn("email", {
        email,
        redirect: false,
        callbackUrl: finalCallbackUrl,
      })
      if (result?.error) {
        console.error("Email sign-in error:", result.error)
      } else {
        setEmailSent(true)
        onEmailSent?.()
      }
    } catch (error) {
      console.error("Email sign-in error:", error)
    } finally {
      setIsEmailLoading(false)
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("mx-auto w-full max-w-sm", className)} {...props}>
      {emailSent ? (
        <div className="neobrutalist-container text-center">
          <div className="text-xl font-black mb-2">Email Sent! 📧</div>
          <div className="neobrutalist-description">
            Check your email for a login link. You can close this window.
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          {showSocialLogins && (
            <>
              <button
                type="button"
                className="neobrutalist-button group w-64"
                onClick={() => {
                  setIsGoogleLoading(true)
                  setIsLoading(true)
                  signIn("google", {
                    redirect: false,
                    callbackUrl: finalCallbackUrl,
                  })
                }}
                disabled={isGoogleLoading || isLoading}
              >
                {isGoogleLoading ? (
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Icons.google className="mr-2 h-4 w-4" />
                )}{" "}
                Sign in with Google
              </button>
              <button
                type="button"
                className="neobrutalist-button group w-64"
                onClick={() => {
                  setIsGithubLoading(true)
                  setIsLoading(true)
                  signIn("github", {
                    redirect: false,
                    callbackUrl: finalCallbackUrl,
                  })
                }}
                disabled={isGithubLoading || isLoading}
              >
                {isGithubLoading ? (
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Icons.github className="mr-2 h-4 w-4" />
                )}{" "}
                Sign in with Github
              </button>

              <div className="relative w-64 my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-4 border-black rounded-full" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-4 font-black text-lg">OR</span>
                </div>
              </div>
            </>
          )}

          <div id="email-login" className="w-64">
            <div className="flex flex-col gap-2">
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                className="w-full rounded-xl border-4 border-black p-2 text-lg font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:translate-x-1 focus:translate-y-1 focus:shadow-none focus:outline-none transition-all bg-white"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isEmailLoading || isLoading}
              />
              <button
                type="button"
                className="neobrutalist-button group w-full"
                onClick={handleEmailSignIn}
                disabled={isEmailLoading || isLoading || !email}
              >
                {isEmailLoading ? (
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "Sign in with Email"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

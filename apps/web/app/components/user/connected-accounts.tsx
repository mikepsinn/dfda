"use client"

import * as React from "react"
import { signIn } from "next-auth/react"
import { useSession } from "next-auth/react"

import { Icons } from "@/components/icons"
import { toast } from "@/components/ui/use-toast"

interface ConnectedAccountsProps extends React.HTMLAttributes<HTMLDivElement> {}

export function ConnectedAccounts({
  className,
  ...props
}: ConnectedAccountsProps) {
  const { data: session, update } = useSession()
  const [isLoading, setIsLoading] = React.useState<{
    [key: string]: boolean
  }>({})

  const handleConnect = async (provider: string) => {
    setIsLoading((prev) => ({ ...prev, [provider]: true }))
    try {
      await signIn(provider, { callbackUrl: "/settings/accounts" })
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading((prev) => ({ ...prev, [provider]: false }))
    }
  }

  const handleDisconnect = async (provider: string) => {
    setIsLoading((prev) => ({ ...prev, [provider]: true }))
    try {
      const response = await fetch("/api/auth/disconnect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ provider }),
      })

      if (!response.ok) {
        throw new Error()
      }

      await update() // Refresh session data
      toast({
        title: "Success",
        description: `Disconnected ${provider} account.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading((prev) => ({ ...prev, [provider]: false }))
    }
  }

  return (
    <div className="neobrutalist-container space-y-6" {...props}>
      <div className="flex flex-col space-y-4">
        <div className="neobrutalist-gradient-container neobrutalist-gradient-pink flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:justify-between">
          <div className="flex items-center space-x-4">
            <Icons.google className="h-6 w-6 text-white" />
            <div className="space-y-1">
              <p className="text-sm font-black text-white">Google</p>
              <p className="text-sm font-bold text-white/80">
                Connect your Google account
              </p>
            </div>
          </div>
          <button
            className="group neobrutalist-button w-full sm:w-auto"
            onClick={() =>
              session?.user?.email
                ? handleDisconnect("google")
                : handleConnect("google")
            }
            disabled={isLoading.google}
          >
            {isLoading.google && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            {session?.user?.email ? "Disconnect" : "Connect"}
          </button>
        </div>

        <div className="neobrutalist-gradient-container neobrutalist-gradient-green flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:justify-between">
          <div className="flex items-center space-x-4">
            <Icons.github className="h-6 w-6 text-white" />
            <div className="space-y-1">
              <p className="text-sm font-black text-white">GitHub</p>
              <p className="text-sm font-bold text-white/80">
                Connect your GitHub account
              </p>
            </div>
          </div>
          <button
            className="group neobrutalist-button w-full sm:w-auto"
            onClick={() =>
              session?.user?.email
                ? handleDisconnect("github")
                : handleConnect("github")
            }
            disabled={isLoading.github}
          >
            {isLoading.github && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            {session?.user?.email ? "Disconnect" : "Connect"}
          </button>
        </div>

        <div className="neobrutalist-gradient-container bg-gradient-to-r from-[#6633FF] to-[#0066FF] flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:justify-between">
          <div className="flex items-center space-x-4">
            <Icons.medical className="h-6 w-6 text-white" />
            <div className="space-y-1">
              <p className="text-sm font-black text-white">DFDA</p>
              <p className="text-sm font-bold text-white/80">
                Connect your DFDA account
              </p>
            </div>
          </div>
          <button
            className="group neobrutalist-button w-full sm:w-auto"
            onClick={() =>
              session?.user?.email
                ? handleDisconnect("dfda")
                : handleConnect("dfda")
            }
            disabled={isLoading.dfda}
          >
            {isLoading.dfda && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            {session?.user?.email ? "Disconnect" : "Connect"}
          </button>
        </div>
      </div>
    </div>
  )
} 
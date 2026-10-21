"use client"

import { useState } from "react"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { demoLogin } from "@/lib/actions/demo-login"
import { clinicDemoLogin, type ClinicDemoRole } from "@/lib/actions/clinic-demo-login"
import { AlertCircle } from "lucide-react"
import { logger } from "@/lib/logger"
import { DemoUserType } from "@/lib/constants/demo-accounts"

interface DemoLoginButtonProps {
  onError: (error: { type: 'email_not_confirmed' | 'other', message: string }) => void;
  showAll?: boolean;
  /** A path on this site to open after sign-in, instead of the role's home page. */
  next?: string | null;
}

export function DemoLoginButton({ onError, showAll = false, next }: DemoLoginButtonProps) {
  const [isLoading, setIsLoading] = useState<DemoUserType | `clinic-${ClinicDemoRole}` | null>(null)
  const router = useRouter()

  const handleDemoLogin = async (userType: DemoUserType) => {
    setIsLoading(userType)
    try {
      const result = await demoLogin(userType)

      if (result && result.success && result.redirectUrl) {
        router.refresh()
        router.push(next ?? result.redirectUrl)
      } else {
        logger.error("Demo login action failed:", { error: result?.error, userType });
        onError({ 
          type: 'other',
          message: result?.error || "Demo login failed. Please try again or contact support."
        });
      }

    } catch (error: any) {
      logger.error("Error calling demo login action:", { error, userType });
      onError({ 
        type: 'other', 
        message: error?.message ?? "An unexpected error occurred. Please try again."
      });
    } finally {
      setIsLoading(null)
    }
  }

  const handleClinicDemoLogin = async (role: ClinicDemoRole) => {
    setIsLoading(`clinic-${role}`)
    try {
      const result = await clinicDemoLogin(role)
      if (result.success && result.redirectUrl) {
        // A full page load: the clinic's preview link sets its cookie, and the page reads the new session.
        window.location.assign(result.redirectUrl)
        return
      }
      onError({ type: 'other', message: result.error ?? "Could not open the demo clinic. Try again." })
    } catch (error: any) {
      logger.error("Error calling the demo clinic sign-in:", { error, role })
      onError({ type: 'other', message: error?.message ?? "An unexpected error occurred. Please try again." })
    }
    setIsLoading(null)
  }

  if (showAll) {
    return (
      <div className="space-y-2 text-center">
         <p className="text-xs text-muted-foreground">Or use a demo account:</p>
         <div className="flex flex-wrap gap-2 justify-center">
          {(['patient', 'provider', 'research-partner', 'developer'] as DemoUserType[]).map((role) => (
            <Button
              key={role}
              variant="outline"
              size="sm"
              onClick={() => handleDemoLogin(role)}
              disabled={!!isLoading}
              className="text-xs flex-grow sm:flex-grow-0"
            >
              {isLoading === role ? "Loading..." : `Demo ${role.replace('-', ' ')}`}
            </Button>
          ))}
          {(['owner', 'patient'] as ClinicDemoRole[]).map((role) => (
            <Button
              key={`clinic-${role}`}
              variant="outline"
              size="sm"
              onClick={() => handleClinicDemoLogin(role)}
              disabled={!!isLoading}
              className="text-xs flex-grow sm:flex-grow-0"
            >
              {isLoading === `clinic-${role}` ? "Loading..." : `Demo clinic ${role}`}
            </Button>
          ))}
         </div>
      </div>
    )
  }

  return (
    <Button
      variant="secondary"
      className="w-full"
      onClick={() => handleDemoLogin('patient')}
      disabled={!!isLoading}
    >
      {isLoading ? (
        "Loading..."
      ) : (
        <>
          <AlertCircle className="mr-2 h-4 w-4" /> Use Demo Account
        </>
      )}
    </Button>
  )
}

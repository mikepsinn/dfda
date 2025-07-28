"use client"

import { useState } from "react"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { demoLogin } from "@/lib/actions/demo-login"
import { AlertCircle } from "lucide-react"
import { logger } from "@/lib/logger"
import { DemoUserType } from "@/lib/constants/demo-accounts"

interface DemoLoginButtonProps {
  onError: (error: { type: 'email_not_confirmed' | 'other', message: string }) => void;
  showAll?: boolean;
}

export function DemoLoginButton({ onError, showAll = false }: DemoLoginButtonProps) {
  const [isLoading, setIsLoading] = useState<DemoUserType | null>(null)
  const router = useRouter()

  const handleDemoLogin = async (userType: DemoUserType) => {
    setIsLoading(userType)
    try {
      const result = await demoLogin(userType)

      if (result && result.success && result.redirectUrl) {
        router.refresh()
        router.push(result.redirectUrl)
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

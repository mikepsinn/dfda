"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { demoLogin } from "@/app/actions/demo-login"
import { Loader2 } from "lucide-react"

interface DemoLoginButtonProps {
  onError?: (error: { type: 'email_not_confirmed' | 'other', message: string }) => void;
}

export function DemoLoginButton({ onError }: DemoLoginButtonProps) {
  const [userType, setUserType] = useState<"patient" | "doctor" | "sponsor">("patient")
  const [isLoading, setIsLoading] = useState(false)

  const handleDemoLogin = async () => {
    console.log('[DEMO] Attempting login as:', userType)
    setIsLoading(true)
    
    try {
      await demoLogin(userType)
      // If we get here, something went wrong because demoLogin should redirect
      console.error('[DEMO] Login completed without redirect')
      onError?.({ 
        type: 'other', 
        message: 'Login failed - please contact help@dfda.earth for assistance' 
      })
    } catch (error) {
      // NEXT_REDIRECT means success
      if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
        console.log('[DEMO] Login successful - redirecting')
        return
      }

      console.error('[DEMO] Login failed:', error)
      
      // Check if it's an email confirmation error
      if (error instanceof Error && 
          'code' in error && 
          error.code === 'email_not_confirmed') {
        onError?.({ 
          type: 'email_not_confirmed',
          message: 'Please check your email to complete registration. You will need to verify your email address before signing in.'
        })
      } else {
        onError?.({ 
          type: 'other',
          message: 'Failed to log in with demo account. Please contact help@dfda.earth for assistance'
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="patient" onValueChange={(value) => setUserType(value as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="patient">Patient</TabsTrigger>
          <TabsTrigger value="doctor">Doctor</TabsTrigger>
          <TabsTrigger value="sponsor">Sponsor</TabsTrigger>
        </TabsList>
      </Tabs>

      <Button onClick={handleDemoLogin} className="w-full" variant="secondary" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Logging in...
          </>
        ) : (
          `Try Demo as ${userType.charAt(0).toUpperCase() + userType.slice(1)}`
        )}
      </Button>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { demoLogin } from "@/app/actions/demo-login"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function DemoLoginButton() {
  const router = useRouter()
  const [userType, setUserType] = useState<"patient" | "doctor" | "sponsor">("patient")
  const [isLoading, setIsLoading] = useState(false)

  const handleDemoLogin = async () => {
    setIsLoading(true)
    try {
      const result = await demoLogin(userType)
      if (result.success && result.redirectUrl) {
        router.push(result.redirectUrl)
      } else if (result.error) {
        toast.error(result.error)
        setIsLoading(false)
      }
    } catch (error) {
      console.error("Demo login error:", error)
      toast.error("Failed to log in with demo account")
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


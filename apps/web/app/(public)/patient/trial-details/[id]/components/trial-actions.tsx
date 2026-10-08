"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { authClient } from '@/lib/auth-client'
import { logger } from "@/lib/logger"
import { useToast } from '@/components/ui/use-toast'
import { createInitialEnrollmentAction } from "@/lib/actions/trial-enrollments"

interface TrialActionsProps {
  trialId: string
  isEnrolled: boolean
  userId?: string
}

export function TrialActions({ trialId, isEnrolled, userId }: TrialActionsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const handleEnroll = async () => {
    if (!userId) {
      router.push(`/login?redirect=/patient/trial-details/${trialId}`)
      return
    }

    setIsLoading(true)

    try {
      const user = (await authClient.getSession()).data?.user

      if (!user) {
        logger.error("No user found during enrollment")
        toast({
          title: 'Error',
          description: 'Failed to enroll in trial. Please try again.',
          variant: 'destructive',
        })
        return
      }

      // Create enrollment using server action
      await createInitialEnrollmentAction(trialId, user.id)

      // Refresh the page to show updated enrollment status
      router.refresh()

      toast({
        title: 'Success',
        description: 'You have been enrolled in the trial.',
      })
    } catch (error) {
      console.error("Error enrolling in trial:", error)
      toast({
        title: 'Error',
        description: 'Failed to enroll in trial. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4 sticky top-4">
      <Card>
        <CardHeader>
          <CardTitle>Participation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEnrolled ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-medium">You are enrolled in this trial</p>
              <p className="text-sm text-green-700 mt-1">
                Check your dashboard for next steps and data submission requirements.
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Check the eligibility criteria before you enroll. A new enrollment starts as pending.
            </p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          {isEnrolled ? (
            <>
              <Button className="w-full" onClick={() => router.push("/patient/")}>
                Go to Dashboard
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push(`/patient/data-submission?trial=${trialId}`)}
              >
                Submit Data
              </Button>
            </>
          ) : (
            <Button className="w-full" onClick={handleEnroll} disabled={isLoading}>
              {isLoading ? "Processing..." : userId ? "Enroll in Trial" : "Log In to Enroll"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}


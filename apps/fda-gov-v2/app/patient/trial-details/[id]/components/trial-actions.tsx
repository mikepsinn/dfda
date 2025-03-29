"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createClient } from '@/lib/supabase/client'
import { logger } from "@/lib/logger"
import { useToast } from '@/components/ui/use-toast'

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
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        logger.error("No user found during enrollment")
        toast({
          title: 'Error',
          description: 'Failed to enroll in trial. Please try again.',
          variant: 'destructive',
        })
        return
      }

      // Create enrollment
      const { error } = await supabase.from("trial_enrollments").insert({
        trial_id: trialId,
        patient_id: user.id,
        doctor_id: "system", // TODO: Get actual doctor ID
        status: "pending",
        enrollment_date: new Date().toISOString(),
        notes: "Initial enrollment request",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

      if (error) {
        logger.error("Error enrolling in trial:", error)
        toast({
          title: 'Error',
          description: 'Failed to enroll in trial. Please try again.',
          variant: 'destructive',
        })
        return
      }

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
            <div className="space-y-2">
              <p className="text-sm">
                Join this trial to contribute to medical research and potentially benefit from innovative treatments.
              </p>
              <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                <li>Access to experimental treatments</li>
                <li>Regular health monitoring</li>
                <li>Contribute to medical advances</li>
                <li>Potential compensation for participation</li>
              </ul>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          {isEnrolled ? (
            <>
              <Button className="w-full" onClick={() => router.push("/patient/dashboard")}>
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
              {isLoading ? "Processing..." : "Enroll in Trial"}
            </Button>
          )}
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Compensation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Per Visit</span>
              <span className="text-sm">$50</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Completion Bonus</span>
              <span className="text-sm">$200</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Compensation may vary based on your participation level and completion of required activities.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


"use client"

import Link from "next/link"
import { Calendar, Check, ChevronRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import type { Database } from "@/lib/database.types"

// Use the auto-generated database types
type TrialRow = Database["public"]["Tables"]["trials"]["Row"]
type DataSubmissionRow = Database["public"]["Tables"]["data_submissions"]["Row"]

// Extend with UI-specific properties
type TrialSubmissionData = {
  trial: TrialRow
  submission: DataSubmissionRow
  currentMilestone?: string
  refundAmount?: number
  progress?: number
}

export function SubmissionComplete({ trialData }: { trialData: TrialSubmissionData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Submission Complete</CardTitle>
        <CardDescription>Thank you for submitting your {trialData.currentMilestone} data</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-8">
        <div className="rounded-full bg-green-100 p-3 mb-4">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Data Submitted Successfully</h3>
        <p className="text-center text-muted-foreground mb-6 max-w-md">
          Your {trialData.currentMilestone} data has been successfully submitted. Your deposit refund of $
          {trialData.refundAmount} will be processed within 3 business days.
        </p>

        <div className="w-full max-w-md rounded-lg border p-4 mb-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Updated Trial Progress</span>
              <span>{trialData.progress ? trialData.progress + 33 : 33}% complete</span>
            </div>
            <Progress value={trialData.progress ? trialData.progress + 33 : 33} className="h-2" />
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Next milestone: 8-week follow-up (Due April 15, 2025)</span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center gap-4">
        <Link href="/patient/dashboard">
          <Button>Return to Dashboard</Button>
        </Link>
        <Link href={`/patient/trial-details/${trialData.trial.id}`}>
          <Button variant="outline">
            View Trial Details
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}

"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrialSubmissionData } from "./data-submission-form"

interface SubmissionCompleteProps {
  trialData: TrialSubmissionData
}

export function SubmissionComplete({ trialData }: SubmissionCompleteProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Submission Complete</CardTitle>
        <CardDescription>Thank you for submitting your data for {trialData.trial.title}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild>
          <a href="/patient/">Return to Dashboard</a>
        </Button>
      </CardContent>
    </Card>
  )
}

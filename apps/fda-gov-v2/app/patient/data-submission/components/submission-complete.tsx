"use client"

import Link from "next/link"
import { Calendar, Check, ChevronRight, CheckCircle } from "lucide-react"
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
  submission: DataSubmissionRow | null
  currentMilestone: string
  refundAmount: number
  progress: number
}

export function SubmissionComplete({ trialData }: { trialData: TrialSubmissionData }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <CheckCircle className="h-8 w-8 text-green-500" />
          <div>
            <CardTitle>Data Submission Complete</CardTitle>
            <CardDescription>Thank you for submitting your data for {trialData.trial.title}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h3 className="font-medium">Next Steps</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Your data will be reviewed by the research team. You will be notified when your refund of ${trialData.refundAmount} has been processed.
            </p>
          </div>

          <div className="flex justify-end">
            <Link href="/patient/dashboard">
              <Button>Return to Dashboard</Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

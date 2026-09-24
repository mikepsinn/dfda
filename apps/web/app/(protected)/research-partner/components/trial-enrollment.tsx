"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import type { Database } from "@/lib/database.types"

// Use the auto-generated database type and extend it with UI-specific properties
type TrialRow = Database["public"]["Tables"]["trials"]["Row"]

interface TrialEnrollmentProps {
  trials: TrialRow[]
}

export function TrialEnrollment({ trials }: TrialEnrollmentProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Trial Enrollment Progress</CardTitle>
        <CardDescription>Current enrollment status for active trials</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {trials.map((trial) => (
            <div key={trial.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{trial.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {trial.start_date ? new Date(trial.start_date).toLocaleDateString() : 'Not started'} - 
                    {trial.end_date ? new Date(trial.end_date).toLocaleDateString() : 'Ongoing'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{trial.status}</span>
                  <span className="text-sm text-muted-foreground">
                    {trial.current_enrollment || 0} / {trial.enrollment_target || 0} participants
                  </span>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Enrollment Progress</span>
                  <span>
                    {trial.current_enrollment || 0} / {trial.enrollment_target || 0} participants
                  </span>
                </div>
                <Progress
                  value={trial.enrollment_target ? ((trial.current_enrollment || 0) / trial.enrollment_target) * 100 : 0}
                  className="h-2"
                />
              </div>
              <div className="flex justify-end">
                <Link href={`/research-partner/trials/${trial.id}`}>
                  <Button size="sm" variant="outline">
                    View Trial
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

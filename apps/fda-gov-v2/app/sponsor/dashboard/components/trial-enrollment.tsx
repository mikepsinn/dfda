"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

interface Trial {
  id: number
  name: string
  status: string
  progress: number
  enrolled: number
  target: number
  startDate: string
  endDate: string
}

interface TrialEnrollmentProps {
  trials: Trial[]
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
                  <div className="font-medium">{trial.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {trial.startDate} - {trial.endDate}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{trial.status}</span>
                  <span className="text-sm text-muted-foreground">
                    {trial.enrolled}/{trial.target} enrolled
                  </span>
                </div>
              </div>
              <Progress value={trial.progress} className="h-2" />
              <div className="flex justify-end">
                <Link href={`/sponsor/trials/${trial.id}`}>
                  <Button variant="ghost" size="sm">
                    View Details <ChevronRight className="ml-1 h-4 w-4" />
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


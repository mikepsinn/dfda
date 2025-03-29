"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ClipboardList, ArrowRight } from "lucide-react"
import type { Database } from "@/lib/database.types"

// Base types from database
type BaseTrialEnrollment = Database["public"]["Tables"]["trial_enrollments"]["Row"]
type BaseTrial = Database["public"]["Tables"]["trials"]["Row"] 
type BaseCondition = Database["public"]["Tables"]["conditions"]["Row"]
type BaseTreatment = Database["public"]["Tables"]["treatments"]["Row"]

// Extended types with additional properties from joins/views
type Condition = BaseCondition & {
  name: string
  description?: string
}

type Treatment = BaseTreatment & {
  name: string
  description?: string
}

type Trial = BaseTrial & {
  title?: string
  conditions: Condition[]
  treatments: Treatment[]
}

type Enrollment = BaseTrialEnrollment & {
  trials: Trial[]
}

interface EnrolledTrialsProps {
  enrollments: Enrollment[]
}

export function EnrolledTrials({ enrollments }: EnrolledTrialsProps) {
  if (enrollments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Enrolled Trials</CardTitle>
          <CardDescription>You are not currently enrolled in any trials</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Active Trials</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            Find and join clinical trials to contribute to medical research and potentially benefit from new treatments.
          </p>
          <Link href="/patient/find-trials">
            <Button>Find Trials to Join</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Enrolled Trials</CardTitle>
        <CardDescription>Trials you are currently participating in</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {enrollments.map((enrollment) => (
            <div
              key={enrollment.id}
              className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{enrollment.trials[0].title}</h3>
                  <Badge variant={getStatusVariant(enrollment.status)}>{formatStatus(enrollment.status)}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {enrollment.trials[0].conditions?.[0]?.name || 'Unknown condition'} • {enrollment.trials[0].treatments?.[0]?.name || 'Unknown treatment'}
                </p>
              </div>
              <Link href={`/patient/trial-details/${enrollment.trials[0].id}`}>
                <Button variant="ghost" size="sm" className="gap-1">
                  Details
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function getStatusVariant(status: string) {
  switch (status) {
    case "active":
      return "default"
    case "pending":
      return "secondary"
    case "completed":
      return "success"
    case "withdrawn":
      return "destructive"
    default:
      return "outline"
  }
}

function formatStatus(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

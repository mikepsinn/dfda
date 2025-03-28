"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ClipboardList, ArrowRight } from "lucide-react"

// TODO: Define a proper type for Enrollment based on database schema
interface Enrollment {
  id: string;
  trial_name: string; // Example property
  status: string;     // Example property
  // Add other relevant properties
  trials: {
    id: string;
    name: string;
    conditions: {
      name: string;
    };
    treatments: {
      name: string;
    };
  };
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
                  <h3 className="font-medium">{enrollment.trials.name}</h3>
                  <Badge variant={getStatusVariant(enrollment.status)}>{formatStatus(enrollment.status)}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {enrollment.trials.conditions.name} • {enrollment.trials.treatments.name}
                </p>
              </div>
              <Link href={`/patient/trial-details/${enrollment.trials.id}`}>
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

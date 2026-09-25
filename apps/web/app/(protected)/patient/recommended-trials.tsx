"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

interface RecommendedTrialsProps {
  trials: any[]
}

export function RecommendedTrials({ trials }: RecommendedTrialsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recommended Trials</CardTitle>
        <CardDescription>Trials that may be relevant to your conditions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {trials.map((trial) => (
            <div key={trial.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{trial.name}</h3>
                  <Badge variant={getStatusVariant(trial.status)}>{formatStatus(trial.status)}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {trial.conditions.name} • {trial.treatments.name}
                </p>
              </div>
              <Link href={`/patient/trial-details/${trial.id}`}>
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
    case "draft":
      return "secondary"
    case "completed":
      return "success"
    case "cancelled":
      return "destructive"
    default:
      return "outline"
  }
}

function formatStatus(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1)
}


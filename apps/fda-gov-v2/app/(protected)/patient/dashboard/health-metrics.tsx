"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { PlusCircle } from "lucide-react"

interface HealthMetricsProps {
  userId: string
}

export function HealthMetrics({ userId }: HealthMetricsProps) {
  const [metrics, setMetrics] = useState({
    submissions: 0,
    completionRate: 0,
    nextSubmission: null,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchMetrics() {
      if (!userId) return

      const supabase = createClientComponentClient()

      // Fetch data submission metrics
      const { data: submissions } = await supabase
        .from("data_submissions")
        .select("id, enrollment_id, submission_date")
        .eq("enrollment_id", userId)

      // In a real app, you would calculate these metrics based on actual data
      setMetrics({
        submissions: submissions?.length || 0,
        completionRate: 85,
        nextSubmission: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      })

      setLoading(false)
    }

    fetchMetrics()
  }, [userId])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Health Metrics</CardTitle>
        <CardDescription>Track your health data submissions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="py-8 text-center text-muted-foreground">Loading metrics...</div>
        ) : (
          <>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Completion Rate</span>
                <span className="text-sm text-muted-foreground">{metrics.completionRate}%</span>
              </div>
              <Progress value={metrics.completionRate} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Submissions</span>
                <span className="font-medium">{metrics.submissions}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Next Submission</span>
                <span className="font-medium">
                  {metrics.nextSubmission ? new Date(metrics.nextSubmission).toLocaleDateString() : "N/A"}
                </span>
              </div>
            </div>

            <Button className="w-full flex items-center justify-center gap-2">
              <PlusCircle className="h-4 w-4" />
              Submit Health Data
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}


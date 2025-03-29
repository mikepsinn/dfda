"use client"

import { Users, FileText, Calendar } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Database } from "@/lib/database.types"

// Use the auto-generated database type for notifications
type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"]

// Extend with UI-specific properties if needed
type ActivityItem = NotificationRow & {
  activityType?: "enrollment" | "data" | "milestone"
  trialTitle?: string
}

interface RecentActivityProps {
  activities: ActivityItem[]
}

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest updates from your trials</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={activity.id || index} className="flex items-start gap-4 rounded-lg border p-3">
              {activity.activityType === "enrollment" && <Users className="mt-0.5 h-5 w-5 text-blue-500" />}
              {activity.activityType === "data" && <FileText className="mt-0.5 h-5 w-5 text-green-500" />}
              {activity.activityType === "milestone" && <Calendar className="mt-0.5 h-5 w-5 text-purple-500" />}
              <div className="flex-1">
                <div className="font-medium">{activity.trialTitle || activity.title}</div>
                <p className="text-sm">{activity.message}</p>
              </div>
              <div className="text-sm text-muted-foreground">
                {new Date(activity.created_at || new Date().toISOString()).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full">
          View All Activity
        </Button>
      </CardFooter>
    </Card>
  )
}

"use client"

import { Users, FileText, Calendar } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Activity {
  type: "enrollment" | "data" | "milestone"
  trial: string
  date: string
  description: string
}

interface RecentActivityProps {
  activities: Activity[]
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
            <div key={index} className="flex items-start gap-4 rounded-lg border p-3">
              {activity.type === "enrollment" && <Users className="mt-0.5 h-5 w-5 text-blue-500" />}
              {activity.type === "data" && <FileText className="mt-0.5 h-5 w-5 text-green-500" />}
              {activity.type === "milestone" && <Calendar className="mt-0.5 h-5 w-5 text-purple-500" />}
              <div className="flex-1">
                <div className="font-medium">{activity.trial}</div>
                <p className="text-sm">{activity.description}</p>
              </div>
              <div className="text-sm text-muted-foreground">{activity.date}</div>
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


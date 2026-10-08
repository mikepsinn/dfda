"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Trial } from "@/lib/actions/trials"

interface RecentActivityProps {
  activities: Trial[]
}

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Your latest trial updates</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="block space-y-2 rounded-lg border p-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{activity.title}</h3>
                <span className="text-sm text-muted-foreground">
                  {activity.created_at ? new Date(activity.created_at).toLocaleDateString() : 'No date'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Status: <span className="capitalize">{activity.status}</span>
              </p>
            </div>
          ))}
          {activities.length === 0 && (
            <p className="text-sm text-muted-foreground">No recent activity.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

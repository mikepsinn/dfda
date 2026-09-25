import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Database } from "@/lib/database.types"
import Link from "next/link"

type Enrollment = Database["public"]["Tables"]["trial_enrollments"]["Row"] & {
  trial: Database["public"]["Tables"]["trials"]["Row"]
}

interface RecentActivityProps {
  activities: Enrollment[]
}

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Your latest trial enrollments and updates</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <Link
              key={activity.id}
              href={`/trial/${activity.trial.id}`}
              className="block space-y-2 rounded-lg border p-4 hover:bg-muted/50"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{activity.trial.title}</h3>
                <span className="text-sm text-muted-foreground">
                  {activity.created_at ? new Date(activity.created_at).toLocaleDateString() : 'No date'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Status: <span className="capitalize">{activity.status}</span>
              </p>
            </Link>
          ))}
          {activities.length === 0 && (
            <p className="text-sm text-muted-foreground">No recent activity.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Database } from "@/lib/database.types"
import Link from "next/link"

type Enrollment = Database["public"]["Tables"]["trial_enrollments"]["Row"] & {
  trial: Database["public"]["Tables"]["trials"]["Row"]
}

interface EnrolledTrialsProps {
  enrollments: Enrollment[]
}

export function EnrolledTrials({ enrollments }: EnrolledTrialsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Enrolled Trials</CardTitle>
        <CardDescription>Your active and completed clinical trials</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {enrollments.map((enrollment) => (
            <Link
              key={enrollment.id}
              href={`/trial/${enrollment.trial.id}`}
              className="block space-y-2 rounded-lg border p-4 hover:bg-muted/50"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{enrollment.trial.title}</h3>
                <span className="text-sm capitalize text-muted-foreground">{enrollment.status}</span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{enrollment.trial.description}</p>
            </Link>
          ))}
          {enrollments.length === 0 && (
            <p className="text-sm text-muted-foreground">No enrolled trials found.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 
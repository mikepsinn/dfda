import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Database } from "@/lib/database.types"

type Enrollment = Database["public"]["Tables"]["enrollments"]["Row"] & {
  trial: Database["public"]["Tables"]["trials"]["Row"]
}

interface PatientOverviewProps {
  name: string
  enrollments: Enrollment[]
  totalEnrollment: number
}

export function PatientOverview({ name, enrollments, totalEnrollment }: PatientOverviewProps) {
  const activeTrials = enrollments.filter(e => e.status === "active").length

  return (
    <Card>
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <CardDescription>Patient Dashboard Overview</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-2xl font-bold">{activeTrials}</p>
            <p className="text-sm text-muted-foreground">Active Trials</p>
          </div>
          <div className="space-y-2">
            <p className="text-2xl font-bold">{totalEnrollment}</p>
            <p className="text-sm text-muted-foreground">Total Enrollments</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 
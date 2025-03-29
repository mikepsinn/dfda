import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface SponsorOverviewProps {
  name: string
  totalTrials: number
  totalEnrollment: number
}

export function SponsorOverview({ name, totalTrials, totalEnrollment }: SponsorOverviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <CardDescription>Sponsor Dashboard Overview</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-2xl font-bold">{totalTrials}</p>
            <p className="text-sm text-muted-foreground">Total Active Trials</p>
          </div>
          <div className="space-y-2">
            <p className="text-2xl font-bold">{totalEnrollment}</p>
            <p className="text-sm text-muted-foreground">Total Enrolled Participants</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 
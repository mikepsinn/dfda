import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ResearchPartnerOverviewProps {
  name: string
  totalTrials: number
  totalEnrollment: number
}

export function ResearchPartnerOverview({ name, totalTrials, totalEnrollment }: ResearchPartnerOverviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <CardDescription>Research Partner Dashboard Overview</CardDescription>
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
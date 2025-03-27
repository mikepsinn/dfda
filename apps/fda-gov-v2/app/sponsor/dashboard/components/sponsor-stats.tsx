import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface SponsorStatsProps {
  activeTrials: number
  totalParticipants: number
  pendingApproval: number
}

export function SponsorStats({ activeTrials, totalParticipants, pendingApproval }: SponsorStatsProps) {
  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Active Trials</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{activeTrials}</div>
          <p className="text-xs text-muted-foreground">{activeTrials === 1 ? "Trial" : "Trials"} in progress</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Total Participants</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{totalParticipants}</div>
          <p className="text-xs text-muted-foreground">Across {activeTrials} active trials</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Pending Approval</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{pendingApproval}</div>
          <p className="text-xs text-muted-foreground">
            {pendingApproval === 1 ? "Trial" : "Trials"} awaiting approval
          </p>
        </CardContent>
      </Card>
    </>
  )
}


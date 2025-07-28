import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Microscope, Users, ClipboardList, Calendar } from "lucide-react"

interface DashboardStatsProps {
  activeTrials: number
  enrolledPatients: number
  eligiblePatients: number
  pendingActions: number
  pendingActionsDueSoon: number
  upcomingVisits: number
  upcomingVisitsThisWeek: number
  upcomingVisitsNextWeek: number
}

export function DashboardStats({
  activeTrials,
  enrolledPatients,
  eligiblePatients,
  pendingActions,
  pendingActionsDueSoon,
  upcomingVisits,
  upcomingVisitsThisWeek,
  upcomingVisitsNextWeek,
}: DashboardStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Trials</CardTitle>
          <Microscope className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeTrials}</div>
          <p className="text-xs text-muted-foreground">{enrolledPatients} patients enrolled</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Eligible Patients</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{eligiblePatients}</div>
          <p className="text-xs text-muted-foreground">Across {activeTrials} active trials</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Actions</CardTitle>
          <ClipboardList className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pendingActions}</div>
          <p className="text-xs text-muted-foreground">{pendingActionsDueSoon} due in next 3 days</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Upcoming Visits</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{upcomingVisits}</div>
          <p className="text-xs text-muted-foreground">
            {upcomingVisitsThisWeek} this week, {upcomingVisitsNextWeek} next week
          </p>
        </CardContent>
      </Card>
    </div>
  )
}


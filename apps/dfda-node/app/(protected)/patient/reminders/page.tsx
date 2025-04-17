import { getServerUser } from "@/lib/server-auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getAllReminderSchedulesForUserAction } from "@/app/actions/reminder-schedules"
import { ReminderSchedulesList } from "@/components/reminders"
import { createLogger } from "@/lib/logger"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, Calendar, CheckCircle } from "lucide-react"

const logger = createLogger("patient-reminders-page")

export default async function PatientRemindersPage() {
  const user = await getServerUser()
  if (!user) {
    redirect("/login")
  }

  logger.info("Loading patient reminders page", { userId: user.id })
  
  // Fetch all reminder schedules for this user
  const allReminders = await getAllReminderSchedulesForUserAction(user.id)
  
  // Group reminders by variable category for tabs
  const activeReminders = allReminders.filter(r => r.is_active)
  const inactiveReminders = allReminders.filter(r => !r.is_active)

  return (
    <div className="container py-6 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Reminders</h1>
      <p className="text-muted-foreground">
        View and manage all your reminders in one place.
      </p>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="active" className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>Active Reminders</span>
          </TabsTrigger>
          <TabsTrigger value="inactive" className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            <span>Inactive Reminders</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Active Reminders</span>
                <span className="text-muted-foreground text-sm font-normal">
                  {activeReminders.length} {activeReminders.length === 1 ? 'reminder' : 'reminders'}
                </span>
              </CardTitle>
              <CardDescription>
                These reminders are currently active and will send notifications at the scheduled times.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReminderSchedulesList reminders={activeReminders} emptyMessage="No active reminders found." />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="inactive" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Inactive Reminders</span>
                <span className="text-muted-foreground text-sm font-normal">
                  {inactiveReminders.length} {inactiveReminders.length === 1 ? 'reminder' : 'reminders'}
                </span>
              </CardTitle>
              <CardDescription>
                These reminders are inactive and won't send notifications.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReminderSchedulesList reminders={inactiveReminders} emptyMessage="No inactive reminders found." />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

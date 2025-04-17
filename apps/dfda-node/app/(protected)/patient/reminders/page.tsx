import { getServerUser } from "@/lib/server-auth"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ReminderListForAllVariables } from "@/components/reminders/reminder-list-for-all-variables"
import { createLogger } from "@/lib/logger"

const logger = createLogger("patient-reminders-page")

export default async function PatientRemindersPage() {
  const user = await getServerUser()
  if (!user) {
    redirect("/login")
  }

  logger.info("Loading patient reminders page", { userId: user.id })
  
  // Get user timezone from profile
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('timezone')
    .eq('id', user.id)
    .single()
  
  const userTimezone = profile?.timezone || 'UTC'

  return (
    <div className="container py-6 space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Reminders</h1>
      <p className="text-muted-foreground mb-4">
        View and manage all your reminders in one place.
      </p>

      {/* Quick overview of all reminders */}
      <ReminderListForAllVariables 
            userId={user.id}
            userTimezone={userTimezone}
          />
    </div>
  )
}

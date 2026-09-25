import { getServerUser } from "@/lib/server-auth"
import { redirect } from "next/navigation"
import { ReminderListForAllVariables } from "@/components/reminders/reminder-list-for-all-variables"
import { createLogger } from "@/lib/logger"
import { getUserProfile } from "@/lib/profile"

const logger = createLogger("patient-reminders-page")

export default async function PatientRemindersPage() {
  const user = await getServerUser()
  if (!user) {
    redirect("/login")
  }

  logger.info("Loading patient reminders page", { userId: user.id })
  
  // Get user profile using helper
  const profile = await getUserProfile(user);
  
  // Determine timezone (fallback to UTC)
  const userTimezone = profile?.timezone || 'UTC'
  logger.info("Using timezone for reminders page", { userId: user.id, timezone: userTimezone })

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

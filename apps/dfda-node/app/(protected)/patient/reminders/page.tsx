import { getServerUser } from "@/lib/server-auth"
import { redirect } from "next/navigation"
import { notFound } from 'next/navigation'
import { getGlobalVariableByIdAction } from "@/app/actions/global-variables"
import { getReminderSchedulesForUserVariableAction } from "@/app/actions/reminder-schedules"
import type { ReminderSchedule } from "@/app/actions/reminder-schedules"
import { createLogger } from "@/lib/logger"
import { Suspense } from "react"

// Import the extracted client component
import { RemindersListClient } from './components/RemindersListClient'

const logger = createLogger("patient-reminders-page")

interface PatientRemindersPageProps {
  searchParams: { variableId?: string };
}

// --- Server Component Page --- 
export default async function PatientRemindersPage({ searchParams }: PatientRemindersPageProps) {
  const user = await getServerUser()
  if (!user) {
    redirect("/login")
  }

  const globalVariableId = searchParams.variableId;
  if (!globalVariableId) {
     logger.warn("Reminder page accessed without variableId (globalVariableId)");
     notFound(); // Need a variable ID to show reminders for
  }

  // Fetch variable details and schedules in parallel
  const [variable, initialSchedules] = await Promise.all([
     getGlobalVariableByIdAction(globalVariableId),
     getReminderSchedulesForUserVariableAction(globalVariableId)
  ]);

  if (!variable) {
     logger.warn("Global variable not found for reminder page", { userId: user.id, globalVariableId });
     notFound(); // Variable not found
  }

  logger.info("Rendering patient reminders page", { userId: user.id, globalVariableId, variableName: variable.name });

  return (
    <div className="container space-y-8 py-8">
       <h1 className="text-2xl font-semibold">Manage Reminders for: {variable.name}</h1>
       <Suspense fallback={<p>Loading reminders...</p>}>
         <RemindersListClient 
            userId={user.id} 
            globalVariableId={globalVariableId} 
            variableName={variable.name} 
            initialSchedules={initialSchedules} // Pass initial schedules fetched on server
          /> 
       </Suspense>
    </div>
  )
} 
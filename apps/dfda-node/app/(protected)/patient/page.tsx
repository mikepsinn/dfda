import { getServerUser } from "@/lib/server-auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
// Remove Plus icon import if Button is removed or doesn't use it
// import { Plus } from "lucide-react"
import { HeartPulse, Pill, Loader2 } from "lucide-react" // Import icons for buttons
import { getPatientConditionsAction } from "@/app/actions/patient-conditions"
// Remove getRatingsByPatientAction import
// import { getRatingsByPatientAction } from "@/app/actions/treatment-ratings"
// Remove getTreatmentsForConditionAction import
// import { getTreatmentsForConditionAction } from "@/app/actions/treatments"
// Import actions for treatments and tasks
// import { getPatientTreatmentsAction } from "@/app/actions/patient-treatments"
import { getPendingReminderNotificationsAction } from "@/app/actions/reminder-schedules"
// Import the new list component (path might need adjustment)
// import { PatientConditionsCard } from "@/components/patient/PatientConditionsCard"
// import { PatientTreatmentsCard } from "@/components/patient/PatientTreatmentsCard" // Remove old card import
// import { PatientTreatmentsSimpleList } from "@/components/patient/PatientTreatmentsSimpleList" // Corrected import path/name
// Removed PatientConditionsCard and PatientTreatmentsCard imports
import { TrackingInbox } from "@/components/patient/TrackingInbox"
import { logger } from "@/lib/logger"
import PatientDashboardClient from "@/components/patient/PatientDashboardClient" // Import the new client component

// Make the page component async
export default async function PatientDashboardPage() {
  logger.info("Rendering PatientDashboardPage (Server Component)");

  // Fetch data directly on the server
  const user = await getServerUser()
  if (!user) {
    logger.info("User not found, redirecting to login.");
    redirect("/login")
    // Note: redirect() throws an error, so function execution stops here.
  }

  // Fetch conditions and notifications in parallel for efficiency
  let conditionsResult;
  let notificationsResult;
  try {
    [conditionsResult, notificationsResult] = await Promise.all([
        getPatientConditionsAction(user.id),
        getPendingReminderNotificationsAction(user.id)
    ]);
  } catch (error) {
      logger.error("Error fetching initial data for dashboard", { userId: user.id, error });
      // Render an error state if fetching fails server-side
      return (
          <div className="container py-8 text-center text-red-600">
              Failed to load dashboard data. Please try refreshing the page.
          </div>
      );
  }
  
  // Redirect to onboarding if no conditions found
  if (!conditionsResult || conditionsResult.length === 0) {
    logger.info("User has no conditions, redirecting to onboarding", { userId: user.id });
    redirect("/patient/onboarding");
  }

  // Render the Client Component and pass data as props
  return (
    <PatientDashboardClient 
      initialUser={user} 
      initialConditions={conditionsResult} 
      initialNotifications={notificationsResult} 
    />
  )
}


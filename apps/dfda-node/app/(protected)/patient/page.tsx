import { getServerUser } from "@/lib/server-auth"
import { redirect } from "next/navigation"
// Remove unused Card imports
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// Remove unused Button import
// import { Button } from "@/components/ui/button"
// Remove unused Link import
// import Link from "next/link"
// Remove unused Icon imports
// import { HeartPulse, Pill, Loader2 } from "lucide-react"
import { getPatientConditionsAction } from "@/lib/actions/patient-conditions"
// Remove unused actions
// import { getRatingsByPatientAction } from "@/app/actions/treatment-ratings"
// import { getTreatmentsForConditionAction } from "@/app/actions/treatments"
// import { getPatientTreatmentsAction } from "@/app/actions/patient-treatments"
import { getPendingReminderNotificationsAction } from "@/lib/actions/reminder-schedules"
// Remove unused component imports
// import { TrackingInbox } from "@/components/patient/TrackingInbox"
import { logger } from "@/lib/logger"
// Import the new display component
import PatientDashboardDisplay from "@/components/patient/PatientDashboardDisplay"
// Import the timeline/variable fetch functions
import { getTimelineItemsForDate } from "@/lib/actions/timeline"
import { getAllUserVariablesAction } from "@/lib/actions/user-variables"

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

  // Fetch all necessary data in parallel
  let conditionsResult;
  let notificationsResult;
  let timelineItemsResult;
  let userVariablesResult;
  const targetDate = new Date(); // Use today's date for initial timeline load

  try {
    // Use Promise.allSettled to handle potential errors in individual fetches
    const results = await Promise.allSettled([
        getPatientConditionsAction(user.id),
        getPendingReminderNotificationsAction(user.id),
        getTimelineItemsForDate(user.id, targetDate),
        getAllUserVariablesAction(user.id)
    ]);

    // Process results, defaulting to empty arrays on failure
    conditionsResult = results[0].status === 'fulfilled' ? results[0].value : [];
    notificationsResult = results[1].status === 'fulfilled' ? results[1].value : [];
    timelineItemsResult = results[2].status === 'fulfilled' ? results[2].value : [];
    userVariablesResult = results[3].status === 'fulfilled' ? results[3].value : [];

     // Log errors if any promise was rejected
     results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const actionName = ['getPatientConditions', 'getPendingNotifications', 'getTimelineItems', 'getUserVariables'][index];
        logger.error(`Error fetching initial data for ${actionName}`, { userId: user.id, error: result.reason });
      }
    });

  } catch (error) {
      // Catch potential errors in Promise.allSettled itself (unlikely)
      logger.error("Critical error during initial data fetch", { userId: user.id, error });
      return (
          <div className="container py-8 text-center text-red-600">
              Failed to load critical dashboard data. Please try refreshing.
          </div>
      );
  }
  
  // Redirect to onboarding if no conditions found (check fulfilled value)
  if (!conditionsResult || conditionsResult.length === 0) {
    logger.info("User has no conditions (or failed fetch), redirecting to onboarding", { userId: user.id });
    redirect("/patient/onboarding");
  }

  // Render the single Client Component with all resolved data
  return (
    <PatientDashboardDisplay 
      initialUser={user} 
      initialConditions={conditionsResult} 
      initialNotifications={notificationsResult} 
      initialTimelineItems={timelineItemsResult}
      initialUserVariables={userVariablesResult}
    />
  )
}


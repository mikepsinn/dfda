import { getServerUser } from "@/lib/server-auth";
import { redirect } from "next/navigation";
import { getConditionsByUserAction, getConditionsAction } from "@/lib/actions/conditions"; // Use getConditionsByUserAction for initial check
import { getTimelineNotificationsForDateAction } from "@/lib/actions/timeline"; // Import from timeline.ts
import { getPendingReminderNotificationsAction } from "@/lib/actions/reminder-schedules"; // Import from reminder-schedules.ts
import { logger } from "@/lib/logger";
// Import the new display component
import PatientDashboardDisplay from "@/components/patient/PatientDashboardDisplay";
// Import the timeline/variable fetch functions
import { getAllUserVariablesAction } from "@/lib/actions/user-variables";
import { getMeasurementsForDateAction } from '@/lib/actions/measurements';
import type { TimelineItem } from '@/components/universal-timeline';
import type { UserVariableWithDetails } from "@/lib/actions/user-variables"; // Import necessary type
import type { UserCondition } from "@/lib/actions/conditions"; // Import necessary type

// Revalidate data every 60 seconds
export const revalidate = 60;

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

  // Fetch initial data needed for checks/inbox separately (original structure)
  let initialConditionsResult = await getConditionsByUserAction(user.id); // Use correct action
  let initialPendingNotifications = await getPendingReminderNotificationsAction(user.id);

  const targetDate = new Date(); // Use today's date for initial timeline load

  // Helper function to process results from Promise.allSettled
  // Handles results that are raw data arrays OR objects like { success: boolean, data: ... }
  const processResult = <T,>(result: PromiseSettledResult<any>, actionName: string): T[] => {
    if (result.status === 'fulfilled') {
      // Check if the value has the { success, data } structure
      if (typeof result.value === 'object' && result.value !== null && 'success' in result.value) {
        if (result.value.success && result.value.data) {
          // Ensure data is returned as an array
          return Array.isArray(result.value.data) ? result.value.data : [result.value.data];
        } else if (!result.value.success) {
          // Handle explicit failure case from the action
          logger.error(`Error reported by action ${actionName}`, { userId: user.id, date: targetDate, error: result.value.error || 'Action reported failure' });
          return [];
        }
      } else if (Array.isArray(result.value)) {
         // Handle case where the value is the raw data array directly
         return result.value as T[];
      }
      // Handle other unexpected successful shapes (e.g., single object without wrapper)
      logger.warn(`Unexpected fulfilled result shape for ${actionName}`, { value: result.value });
      // Attempt to return as array if possible, otherwise empty
      return Array.isArray(result.value) ? result.value : (result.value ? [result.value] : []);
    } else { // status === 'rejected'
      const error = result.reason;
      logger.error(`Error fetching ${actionName}`, { userId: user.id, date: targetDate, error });
      return []; // Return empty array on error or unexpected success shape
    }
  };

  // Fetch remaining data in parallel
  const results = await Promise.allSettled([
    getAllUserVariablesAction(user.id),
    getConditionsAction(), // Fetch detailed conditions if needed separately from initial check?
    getMeasurementsForDateAction(user.id, targetDate), // Fetch timeline measurements
    getTimelineNotificationsForDateAction(user.id, targetDate) // Fetch timeline notifications from timeline.ts
  ]);

  // Process results, handling potential errors
  // Use the helper, providing the correct expected type for data
  const initialUserVariables = processResult<UserVariableWithDetails>(
    results[0],
    'user variables'
  );
  const detailedConditions = processResult<{id: string, name: string, description: string | null, emoji: string | null}>(
    results[1],
    'detailed conditions'
  );
  const initialMeasurements = processResult<TimelineItem>(
    results[2],
    'timeline measurements'
  );
  const initialTimelineNotifications = processResult<TimelineItem>(
    results[3],
    'timeline notifications'
  );

  // Redirect to onboarding if user has no conditions (implies first login or error)
  // Use the initial check result for redirect logic
  if (!initialConditionsResult || initialConditionsResult.length === 0) {
    logger.info("User has no conditions (or failed fetch), redirecting to onboarding", { userId: user.id });
    redirect("/patient/onboarding");
  }

  // Render the single Client Component with all resolved data
  return (
    <PatientDashboardDisplay
      initialUser={user} // Pass user fetched earlier
      initialConditions={initialConditionsResult} // Conditions from initial check
      initialPendingNotifications={initialPendingNotifications} // Notifications for inbox?
      initialMeasurements={initialMeasurements} // Timeline data
      initialTimelineNotifications={initialTimelineNotifications} // Timeline data
      initialUserVariables={initialUserVariables} // User variables
    />
  )
}

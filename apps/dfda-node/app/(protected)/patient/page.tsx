import { getServerUser } from "@/lib/server-auth";
import { redirect } from "next/navigation";
import { getConditionsByUserAction } from "@/lib/actions/conditions"; // Use getConditionsByUserAction for initial check
import { getPendingReminderNotificationsAction } from "@/lib/actions/reminder-schedules"; // Import from reminder-schedules.ts
import { logger } from "@/lib/logger";
// Import the new display component
import PatientDashboardDisplay from "@/components/patient/PatientDashboardDisplay";
// Import the timeline/variable fetch functions
import { getAllUserVariablesAction } from "@/lib/actions/user-variables";
import { getMeasurementsForDateAction } from '@/lib/actions/measurements';
import type { MeasurementCardData } from "@/components/measurement-card"; // ADD THIS
import type { UserVariableWithDetails } from "@/lib/actions/user-variables"; // Import necessary type
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { PatientConditionRow } from "@/lib/actions/conditions"; // Import necessary type
import type { FetchedPendingNotification } from '@/lib/actions/reminder-schedules'; // UPDATE to FetchedPendingNotification
import type { ReminderNotificationCardData, ReminderNotificationStatus } from "@/components/reminder-notification-card"; // ADD THIS

// Revalidate data every 60 seconds
export const revalidate = 60;

// Make the page component async
export default async function PatientDashboardPage() {
  logger.info("Rendering PatientDashboardPage (Server Component)");

  // Fetch data directly on the server
  const user = await getServerUser()
  if (!user) {
    logger.error('[Page - PatientDashboard] No user found, redirecting to login');
    return redirect("/login")
    // Note: redirect() throws an error, so function execution stops here.
  }

  logger.info('[Page - PatientDashboard] User found, fetching initial data', { userId: user.id });

  const serverToday = new Date(); // Define serverToday

  // Fetch initial data in parallel
  const results = await Promise.all([
    getAllUserVariablesAction(user.id),         // results[0]
    getConditionsByUserAction(user.id),                 // results[1]
    getPendingReminderNotificationsAction(user.id),     // results[2]
    getMeasurementsForDateAction(user.id, serverToday) // results[3] - Use serverToday
  ]);

  // Helper function to process results from Promise.all
  // Handles results that are raw data arrays OR objects like { success: boolean, data: ... }
  const processResult = <T,>(result: any, actionName: string): T[] => {
    if (typeof result === 'object' && result !== null && 'success' in result) {
      if (result.success && result.data) {
        // Ensure data is returned as an array
        return Array.isArray(result.data) ? result.data : [result.data];
      } else if (!result.success) {
        // Handle explicit failure case from the action
        logger.error(`Error reported by action ${actionName}`, { userId: user.id, date: new Date(), error: result.error || 'Action reported failure' });
        return [];
      }
    } else if (Array.isArray(result)) {
       // Handle case where the value is the raw data array directly
       return result as T[];
    }
    // Handle other unexpected successful shapes (e.g., single object without wrapper)
    logger.warn(`Unexpected fulfilled result shape for ${actionName}`, { value: result });
    // Attempt to return as array if possible, otherwise empty
    return Array.isArray(result) ? result : (result ? [result] : []);
  };

  // Process results with error handling
  const initialUserVariables = processResult<UserVariableWithDetails>(
    results[0],
    'user variables'
  );

  const initialConditionsResult = processResult<PatientConditionRow>(
    results[1],
    'initial conditions'
  );

  // Now FetchedPendingNotification[]
  const initialPendingNotificationsData = processResult<FetchedPendingNotification>(
    results[2],
    'pending notifications'
  );

  const initialMeasurementsData = processResult<MeasurementCardData>(
    results[3],
    'initial measurements'
  );
  
  // Map FetchedPendingNotification[] to ReminderNotificationCardData[] for UniversalTimeline
  const initialTimelineNotificationsForDisplay: ReminderNotificationCardData[] = initialPendingNotificationsData.map(task => {
    // No need for 'as any' for status, defaultValue, emoji if FetchedPendingNotification is correctly typed
    return {
      id: task.notificationId,
      reminderScheduleId: task.scheduleId,
      triggerAtUtc: task.dueAt,
      status: task.status, // Directly use from FetchedPendingNotification
      variableName: task.variableName,
      variableCategoryId: task.variableCategory,
      unitId: task.unitId!,
      unitName: task.unitName!,
      globalVariableId: task.globalVariableId,
      userVariableId: task.userVariableId,
      details: task.message || undefined,
      detailsUrl: undefined,
      isEditable: task.status === 'pending',
      defaultValue: task.defaultValue,
      emoji: task.emoji,
      currentValue: null, 
      loggedValueUnit: undefined,
    };
  });

  // Redirect to onboarding if user has no conditions (implies first login or error)
  // Use the initial check result for redirect logic
  if (!initialConditionsResult || initialConditionsResult.length === 0) {
    logger.info("User has no conditions (or failed fetch), redirecting to onboarding", { userId: user.id });
    redirect("/patient/onboarding");
  }

  // Render the single Client Component with all resolved data
  return (
    <PatientDashboardDisplay
      initialUser={user} 
      initialConditions={initialConditionsResult} 
      initialPendingNotifications={initialPendingNotificationsData} // This is for TrackingInbox (expects PendingNotificationTask[])
      // Pass distinct data for UniversalTimeline
      initialMeasurements={initialMeasurementsData} 
      initialTimelineNotifications={initialTimelineNotificationsForDisplay} // UPDATED to mapped data
      initialUserVariables={initialUserVariables} 
      initialDateForTimeline={serverToday.toISOString()} // Pass serverToday as ISO string
    />
  )
}

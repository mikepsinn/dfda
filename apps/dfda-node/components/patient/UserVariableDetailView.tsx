import { getUserVariableDetailsAction } from "@/lib/actions/user-variables";
import { ScheduleTimeline } from "./ScheduleTimeline";
import { ReminderListForUserVariable } from "@/components/reminders/reminder-list-for-user-variable";
import { logger } from "@/lib/logger";
import { format } from 'date-fns';
import { getUserProfile } from "@/lib/profile";
import { createClient } from "@/utils/supabase/server";

interface UserVariableDetailViewProps {
  userId: string;
  userVariableId: string;
}

export async function UserVariableDetailView({ userId, userVariableId }: UserVariableDetailViewProps) {
  
  // Fetch user profile first
  const supabase = await createClient(); 
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
      logger.error("UserVariableDetailView: Error fetching authenticated user.", { userId, userVariableId, error: authError });
      // Cannot proceed without user, maybe redirect or show generic error?
      return <p className="text-destructive">Authentication error. Cannot load details.</p>;
  }
  
  // Now fetch variable details and profile data
  const [variableDetailsResult, profile] = await Promise.all([
    getUserVariableDetailsAction(userVariableId, userId),
    getUserProfile(user) // Pass the user object fetched above
  ]);

  // --- Handle Variable Details --- 
  let variableName = 'This Variable';
  let variableEmoji: string | null = null;
  let globalVariableId: string | undefined;
  let variableCategoryId: string | undefined;
  let unitName: string | null = null;

  if (!variableDetailsResult.success || !variableDetailsResult.data) {
    logger.error("UserVariableDetailView: Failed to load variable details", { userId, userVariableId, error: variableDetailsResult.error });
    // Return early if core variable data fails
    return <p className="text-destructive">Error loading variable details: {variableDetailsResult.error}</p>;
  } else {
      const variable = variableDetailsResult.data;
      variableName = variable.global_variables?.name ?? 'This Variable';
      variableEmoji = variable.global_variables?.emoji ?? null;
      globalVariableId = variable.global_variable_id; // Assign global ID
      variableCategoryId = variable.global_variables?.variable_category_id; // Assign category ID
      unitName = variable.units?.abbreviated_name ?? variable.global_variables?.units?.abbreviated_name ?? null; // Assign unit name
  }

  // --- Handle Timezone --- 
  const userTimezone = profile?.timezone || 'UTC'; // Default to UTC if not found
  if (!profile?.timezone) {
      logger.warn("UserVariableDetailView: User timezone not found, defaulting to UTC", { userId });
  }

  // Determine the target date (e.g., today)
  const today = format(new Date(), 'yyyy-MM-dd'); 

  return (
    <div className="space-y-8"> {/* Increased spacing */}
       {/* Display Variable Header */}
       <h2 className="text-2xl font-semibold flex items-center">
         {variableEmoji && <span className="text-3xl mr-3">{variableEmoji}</span>}
         {variableName}
      </h2>
       
      {/* Schedule Timeline Section */} 
      <ScheduleTimeline 
        userId={userId}
        userVariableIds={[userVariableId]} 
        targetDate={today} 
      />
      
      {/* Reminder Management Section */} 
      {globalVariableId ? (
          <ReminderListForUserVariable 
              userId={userId}
              userVariableId={userVariableId}
              variableName={variableName}
              unitName={unitName || 'units'} // Pass unit name, provide default if null
              userTimezone={userTimezone}
              variableCategoryId={variableCategoryId}
          />
      ) : (
          <div className="p-4 border rounded-md bg-muted/50">
              <p className="text-muted-foreground text-sm">Reminders cannot be set up for this variable as it's missing a link to a standard global variable.</p>
          </div>
      )}

    </div>
  );
} 
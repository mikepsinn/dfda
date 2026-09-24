import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getMeasurementsForDateAction } from "@/lib/actions/measurements";
import { getTimelineNotificationsForDateAction } from "@/lib/actions/reminder-notifications";
// import { UserVariableForm } from "@/components/user-variables/user-variable-form"; // Path to be verified
import UserVariableDetailClientTimeline from "@/components/patient/UserVariableDetailClientTimeline";
import { ReminderListForUserVariable } from "@/components/reminders/reminder-list-for-user-variable";
import { logger } from "@/lib/logger";
import { format } from 'date-fns';
import { getUserProfile } from "@/lib/profile";
import { createClient } from "@/utils/supabase/server";
import type { UserVariableWithDetails } from "@/lib/actions/user-variables";
import type { MeasurementCardData } from "@/components/measurement-card";
import type { ReminderNotificationDetails } from "@/lib/database.types.custom";

interface UserVariableDetailViewProps {
  userVariable: UserVariableWithDetails;
  currentDate: string; // Expecting YYYY-MM-DD string
  userId: string;
}

export async function UserVariableDetailView({ userVariable, currentDate, userId }: UserVariableDetailViewProps) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    logger.error('User not authenticated in UserVariableDetailView', { userError });
    return <p>User not authenticated. Please log in.</p>;
  }
  if (user.id !== userId) {
    logger.warn('User ID mismatch in UserVariableDetailView', { authUserId: user.id, propUserId: userId });
    return <p>Access denied: User ID mismatch.</p>;
  }

  const profile = await getUserProfile(user);
  const userTimezone = profile?.timezone || 'UTC';
  const targetDate = new Date(currentDate + 'T00:00:00');

  const allMeasurementsResult = await getMeasurementsForDateAction(userId, targetDate);
  const notificationsResult = await getTimelineNotificationsForDateAction(userId, targetDate);

  const measurements: MeasurementCardData[] = allMeasurementsResult.success && allMeasurementsResult.data 
    ? allMeasurementsResult.data.filter(m => m.globalVariableId === userVariable.global_variable_id)
    : [];
  const timelineNotifications: ReminderNotificationDetails[] = notificationsResult.success && notificationsResult.data 
    ? notificationsResult.data.filter(n => n.globalVariableId === userVariable.global_variable_id)
    : [];

  const variableName = userVariable.global_variables?.name || 'This Variable';
  const unitName = userVariable.units?.abbreviated_name || userVariable.global_variables?.units?.abbreviated_name || 'units';
  const variableCategoryId = userVariable.global_variables?.variable_category_id;

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            {userVariable.global_variables?.emoji && <span className="mr-3 text-3xl">{userVariable.global_variables.emoji}</span>}
            {variableName}
          </CardTitle>
        </CardHeader>
      </Card>

      <Tabs defaultValue="timeline" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="reminders">Reminders</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="timeline">
          <h3 className="text-lg font-semibold mb-2">Daily Log for {format(targetDate, 'MMMM d, yyyy')}</h3>
          <UserVariableDetailClientTimeline 
            userId={userId}
            userVariable={userVariable} 
            initialMeasurements={measurements}
            initialTimelineNotifications={timelineNotifications}
          />
        </TabsContent>
        <TabsContent value="reminders">
            <ReminderListForUserVariable 
                userId={userId}
                userVariableId={userVariable.id}
                variableName={variableName}
                unitName={unitName}
                userTimezone={userTimezone}
                variableCategoryId={variableCategoryId}
            />
        </TabsContent>
        <TabsContent value="settings">
          {/* <UserVariableForm userVariable={userVariable} userId={userId} /> */}
          <p className="text-muted-foreground">Variable settings and customization options will be here.</p>
        </TabsContent>
      </Tabs>
    </div>
  );
} 
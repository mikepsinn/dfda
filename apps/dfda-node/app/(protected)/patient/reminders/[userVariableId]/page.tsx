import React from 'react'
import Link from 'next/link'
import { createClient } from "@/lib/supabase/server"
import { notFound } from 'next/navigation'
import { logger } from '@/lib/logger'
import { EditScheduleClient, type ReminderScheduleData } from '@/components/reminders'
// import { parseISO } from 'date-fns' // Removed unused import
import { Database } from '@/lib/database.types'
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb"
import { getUserProfile } from "@/lib/profile"; // Import helper

// Helper function to map DB schedule to client data format
// (Keep this local or import from a shared utility if it exists)
function mapDbToSchedulerData(dbSchedule: Database['public']['Tables']['reminder_schedules']['Row']): ReminderScheduleData & { id: string } {
  return {
    id: dbSchedule.id,
    rruleString: dbSchedule.rrule,
    timeOfDay: dbSchedule.time_of_day, // Assuming it's already HH:mm
    startDate: new Date(dbSchedule.start_date),
    endDate: dbSchedule.end_date ? new Date(dbSchedule.end_date) : null,
    isActive: dbSchedule.is_active,
    default_value: dbSchedule.default_value
  };
}

// Helper function to fetch schedules (keep local or import)
async function getReminderSchedulesForUserVariableAction(
  userId: string, 
  globalVariableId: string
): Promise<Database['public']['Tables']['reminder_schedules']['Row'][] | null> { 
  const supabase = await createClient();
  logger.info('Fetching reminder schedules for user variable', { userId, globalVariableId });

   // 1. Find the specific user_variable record for this user and global variable
    const { data: userVariable, error: uvError } = await supabase
        .from('user_variables')
        .select('id')
        .eq('user_id', userId)
        .eq('global_variable_id', globalVariableId)
        .maybeSingle();

    if (uvError) {
        logger.error('Error fetching user_variable for reminders', { userId, globalVariableId, error: uvError });
        return null; // Indicate error
    }

    if (!userVariable) {
        logger.info('No user_variable found for this user/global variable combination.', { userId, globalVariableId });
        return []; // No user variable means no reminders
    }

    const userVariableId = userVariable.id;
    logger.info('Found user_variable_id, fetching schedules', { userVariableId });

    // 2. Fetch reminder schedules using the found user_variable.id
    const { data, error } = await supabase
        .from('reminder_schedules')
        .select('*')
        .eq('user_variable_id', userVariableId)
        .order('created_at', { ascending: true });

    if (error) {
        logger.error('Error fetching reminder schedules using user_variable_id', { userVariableId, error });
        return null; // Indicate error
    }
    logger.info(`Found ${data?.length ?? 0} reminder schedules`, { userVariableId });
    return data || [];
}

// Ensure the component is async if you need to await inside
export default async function VariableRemindersPage({ params }: { params: { userVariableId: string } }) {

  const { userVariableId } = await params
  
  logger.info('Rendering Variable Reminders Page', { userVariableId });

  const supabase = await createClient() // Keep for other fetches
  
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData?.user) {
     logger.error('User not found', { error: userError })
     notFound(); 
  }
  const user = userData.user; // Get user object
  const userId = user.id

  // Fetch user variable details - Use params.userVariableId
  const { data: userVariable, error: uvError } = await supabase
      .from('user_variables')
      .select(`
        id,
        global_variable_id,
        preferred_unit_id,
        global_variables (
          id,
          name,
          default_unit_id,
          variable_category_id
        ),
        units:preferred_unit_id (
          id,
          abbreviated_name
        )
      `)
      .eq('id', userVariableId) // Use directly
      .eq('user_id', userId)
      .single();
  
  if (uvError || !userVariable) {
    logger.error('Error fetching user variable details or not found', { userVariableId: userVariableId, error: uvError });
    notFound();
  }

  const variableName = userVariable.global_variables?.name || 'Unknown Variable'
  // const unitName = userVariable.units?.abbreviated_name || '' // Removed unused variable
  // const variableCategoryId = userVariable.global_variables?.variable_category_id // Not used currently

  // Fetch schedules using the specific ID - Use userVariableId
  const scheduleData = await getReminderSchedulesForUserVariableAction(
      userId,
      userVariable.global_variable_id // Fetch by global ID, not user variable ID
  );

  if (scheduleData === null) { // Check explicitly for null (indicating fetch error)
    logger.error('Failed to fetch schedule data due to error', { userVariableId });
    // Decide how to handle - show error message or redirect?
    // For now, let's use notFound()
    notFound(); 
  }

  // Fetch user profile using helper
  const profile = await getUserProfile(user);
  const userTimezone = profile?.timezone || 'UTC'; // Default if not found
  if(!profile) {
      logger.warn('Failed to fetch user profile for timezone, defaulting to UTC', { userId });
  } else if (!profile.timezone) {
      logger.warn('User profile lacks timezone, defaulting to UTC', { userId });
  }

  // Transform schedules to the format ReminderScheduler expects
  // scheduleData is now guaranteed to be an array (possibly empty) or we would have called notFound()
  const transformedSchedules = scheduleData.map(mapDbToSchedulerData);

  return (
    <div className="container mx-auto px-4 py-8">
        <Breadcrumb>
            <BreadcrumbList>
                <BreadcrumbItem>
                <BreadcrumbLink asChild>
                    <Link href="/patient/reminders">Reminders</Link>
                </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                <BreadcrumbPage>{variableName}</BreadcrumbPage>
                </BreadcrumbItem>
            </BreadcrumbList>
        </Breadcrumb>

        <h1 className="text-2xl font-semibold my-4">Edit Reminders for {variableName}</h1>
        
        {/* Pass userVariable.id to the client component */}
        <EditScheduleClient 
          userVariableId={userVariable.id} 
          scheduleData={transformedSchedules} 
          variableName={variableName} 
          userTimezone={userTimezone} 
          userId={userId} 
        />
    </div>
  );
} 
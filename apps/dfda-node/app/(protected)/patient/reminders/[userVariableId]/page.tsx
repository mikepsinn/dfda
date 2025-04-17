import React from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from "@/lib/supabase/server"
import { notFound } from 'next/navigation'
import { logger } from '@/lib/logger'
import { EditScheduleClient, type ReminderScheduleData } from '@/components/reminders'
import { parseISO } from 'date-fns'
import { Database } from '@/lib/database.types'
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb"

// Function to fetch necessary variable data and potentially the schedule
async function fetchVariableAndScheduleData(userVariableId: string, userId: string) {
    const supabase = await createClient();

    // 1. Fetch Variable data (including name) AND Profile Timezone in parallel
    const [variableResult, profileResult] = await Promise.all([
        supabase
            .from('user_variables')
            .select(`
                id,
                global_variables!inner(
                    id,
                    name
                ),
                preferred_unit_id,
                units:preferred_unit_id(id, abbreviated_name)
            `)
            .eq('id', userVariableId)
            .eq('user_id', userId)
            .single(),
        supabase
            .from('profiles')
            .select('timezone')
            .eq('id', userId)
            .single()
    ]);

    const { data: variableData, error: variableError } = variableResult;
    const { data: profileData, error: profileError } = profileResult;

    if (profileError) {
        logger.error('Error fetching user profile for timezone', { userId, error: profileError.message });
        return null; 
    }
    
    const userTimezone = profileData?.timezone || 'UTC';
    logger.info('Fetched user timezone', { userId, timezone: userTimezone });

    if (variableError) {
        logger.error('Error fetching user variable data for schedule', { userVariableId, userId, error: variableError.message });
        return null;
    }
    
    if (!variableData) {
        logger.warn('User variable not found', { userVariableId, userId });
        return null;
    }

    const variableName = variableData.global_variables?.name ?? 'Unknown Variable';

    // 2. Fetch all Reminder Schedules for this variable
    const { data: schedulesData, error: scheduleError } = await supabase
        .from('reminder_schedules')
        .select('*')
        .eq('user_variable_id', userVariableId)
        .eq('user_id', userId)
        .order('time_of_day', { ascending: true });

    if (scheduleError) {
        logger.error('Error fetching reminder schedule data', { userVariableId, userId, error: scheduleError.message });
        return {
            variableName,
            unitName: variableData.units?.abbreviated_name,
            userTimezone,
            scheduleData: []
        };
    }

    // Convert each schedule to client format
    const schedules = (schedulesData || []).map(schedule => {
        const reminderSchedule: ReminderScheduleData & { id: string } = {
            id: schedule.id,
            rruleString: schedule.rrule,
            timeOfDay: schedule.time_of_day,
            startDate: schedule.start_date ? parseISO(schedule.start_date) : new Date(),
            endDate: schedule.end_date ? parseISO(schedule.end_date) : null,
            isActive: schedule.is_active,
        };
        return reminderSchedule;
    });

    logger.info('Found reminder schedules', { 
        userVariableId, 
        count: schedules.length 
    });

    return {
        variableName,
        unitName: variableData.units?.abbreviated_name,
        userTimezone,
        scheduleData: schedules
    };
}

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
  
  logger.info('Rendering Variable Reminders Page', { userVariableId: params.userVariableId });

  const supabase = await createClient()
  
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData?.user) {
     logger.error('User not found', { error: userError })
     // Instead of returning JSX, use notFound() for consistency or redirect()
     notFound(); 
  }
  const userId = userData.user.id

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
      .eq('id', params.userVariableId) // Use directly
      .eq('user_id', userId)
      .single();
  
  if (uvError || !userVariable) {
    logger.error('Error fetching user variable details or not found', { userVariableId: params.userVariableId, error: uvError });
    notFound();
  }

  const variableName = userVariable.global_variables?.name || 'Unknown Variable'
  const unitName = userVariable.units?.abbreviated_name || ''
  // const variableCategoryId = userVariable.global_variables?.variable_category_id // Not used currently

  // Fetch schedules using the specific ID - Use params.userVariableId
  const scheduleData = await getReminderSchedulesForUserVariableAction(
      userId,
      userVariable.global_variable_id // Fetch by global ID, not user variable ID
  );

  if (scheduleData === null) { // Check explicitly for null (indicating fetch error)
    logger.error('Failed to fetch schedule data due to error', { userVariableId: params.userVariableId });
    // Decide how to handle - show error message or redirect?
    // For now, let's use notFound()
    notFound(); 
  }

  // Fetch user timezone
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('timezone')
    .eq('id', userId)
    .single();

  const userTimezone = profile?.timezone || 'UTC'; // Default if not found
  if(profileError) {
    logger.warn('Error fetching user timezone, defaulting to UTC', { userId, error: profileError });
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
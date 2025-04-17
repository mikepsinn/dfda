import React from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from 'next/navigation'
import { logger } from '@/lib/logger'
import { EditScheduleClient, type ReminderScheduleData } from '@/components/reminders'
import { parseISO } from 'date-fns'

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

export default async function VariableRemindersPage({ params }: { params: { userVariableId: string } }) {
  const { userVariableId } = params;
  logger.info('Rendering Variable Reminders Page', { userVariableId });

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?message=Please log in to edit variable reminders.")
  }

  // Fetch variable, schedule data, and user timezone
  const fetchedData = await fetchVariableAndScheduleData(userVariableId, user.id);

  // Check if essential data was fetched
  if (!fetchedData) { 
    logger.warn('Essential data not found for variable reminders', { userVariableId, userId: user.id });
    notFound(); 
  }

  return (
    <div className="container py-6 space-y-6">
      {/* Back Link */}
      <Link 
        href="/patient/reminders"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to All Reminders
      </Link>

      {/* Render the Client Component */}
      <EditScheduleClient 
        userVariableId={userVariableId}
        scheduleData={fetchedData.scheduleData}
        variableName={fetchedData.variableName}
        userTimezone={fetchedData.userTimezone}
        userId={user.id}
      />
    </div>
  )
} 
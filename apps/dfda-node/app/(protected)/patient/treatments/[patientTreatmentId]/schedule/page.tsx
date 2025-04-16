import React from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from 'next/navigation'
import { logger } from '@/lib/logger'
import EditScheduleClient from './edit-schedule-client' // Import the client component
import type { ReminderScheduleData } from '@/components/reminder-scheduler' // Import type for casting
import { parseISO } from 'date-fns' // To convert string dates back to Date objects
import type { Database } from "@/lib/database.types"

// Define the type for the reminder schedule row more strictly
type ReminderScheduleRow = Database['public']['Tables']['reminder_schedules']['Row'];

// Function to fetch necessary treatment data and potentially the schedule
// Now also fetches the user profile timezone
async function fetchTreatmentAndScheduleData(patientTreatmentId: string, userId: string) {
    const supabase = await createClient();

    // 1. Fetch Patient Treatment data (including user_variable_id and name) AND Profile Timezone in parallel
    const [treatmentResult, profileResult] = await Promise.all([
        supabase
            .from('patient_treatments')
            .select(`
                id,
                user_variable_id,
                treatments!inner(
                    global_variables!inner(
                        name
                    )
                )
            `)
            .eq('id', patientTreatmentId)
            .eq('patient_id', userId)
            .single(),
        supabase
            .from('profiles')
            .select('timezone')
            .eq('id', userId)
            .single()
    ]);

    const { data: treatmentData, error: treatmentError } = treatmentResult;
    const { data: profileData, error: profileError } = profileResult;

    if (profileError) {
        logger.error('Error fetching user profile for timezone', { userId, error: profileError.message });
        // Decide how to handle this - maybe default to UTC or prevent schedule editing?
        // For now, return null to indicate failure.
        return null; 
    }
    const userTimezone = profileData?.timezone || 'UTC'; // Default to UTC if profile timezone is null
    logger.info('Fetched user timezone', { userId, timezone: userTimezone });

    if (treatmentError) {
        logger.error('Error fetching patient treatment data for schedule', { patientTreatmentId, userId, error: treatmentError.message });
        // Return null if treatment data fails, even if timezone succeeded
        return null;
    }
     if (!treatmentData) {
         logger.warn('Patient treatment not found', { patientTreatmentId, userId });
         return null; // Return null if treatment not found
     }

    const treatmentName = treatmentData.treatments?.global_variables?.name ?? 'Unknown Treatment';

    // Handle case where user_variable_id might be missing (though less likely now we check treatmentData)
    if (!treatmentData.user_variable_id) {
         logger.warn('Patient treatment missing user_variable_id', { patientTreatmentId, userId });
        return { 
             id: treatmentData.id,
             treatmentName,
             userTimezone, // Still return timezone
             scheduleData: [] // Return empty array for schedules
        };
    }

    // 2. Fetch all Reminder Schedules using the user_variable_id
    const { data: schedulesData, error: scheduleError } = await supabase
        .from('reminder_schedules')
        .select('*')
        .eq('user_variable_id', treatmentData.user_variable_id)
        .eq('user_id', userId)
        .order('time_of_day', { ascending: true });

    if (scheduleError) {
        logger.error('Error fetching reminder schedule data', { userVariableId: treatmentData.user_variable_id, userId, error: scheduleError.message });
        return {
            id: treatmentData.id,
            treatmentName,
            userTimezone,
            scheduleData: [] // Return empty array for schedules on error
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
        userVariableId: treatmentData.user_variable_id, 
        count: schedules.length 
    });

    return {
        id: treatmentData.id,
        userVariableId: treatmentData.user_variable_id as string,
        treatmentName,
        userTimezone,
        scheduleData: schedules
    };
}

export default async function EditSchedulePage({ params }: { params: Promise<{ patientTreatmentId: string }> }) {
  const { patientTreatmentId } = await params;
  logger.info('Rendering Edit Schedule Page', { patientTreatmentId });

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?message=Please log in to edit treatment schedules.")
  }

  // Fetch treatment, schedule data, and user timezone
  const fetchedData = await fetchTreatmentAndScheduleData(patientTreatmentId, user.id);

  // Check if essential data was fetched (including timezone handling in fetch function)
  if (!fetchedData || !fetchedData.id || !fetchedData.userTimezone || !fetchedData.userVariableId) { 
    logger.warn('Essential data not found for schedule edit (treatment, timezone, or userVariableId)', { patientTreatmentId, userId: user.id, fetchedData });
    notFound(); 
  }

  return (
    <div className="container py-6 space-y-6">
      {/* Back Link */}
      <Link 
        href={`/patient/treatments/${patientTreatmentId}`}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Treatment Details
      </Link>

      {/* Render the Client Component */}
      <EditScheduleClient 
        patientTreatmentId={patientTreatmentId}
        userVariableId={fetchedData.userVariableId}
        scheduleData={fetchedData.scheduleData}
        treatmentName={fetchedData.treatmentName}
        userTimezone={fetchedData.userTimezone}
      />
    </div>
  )
} 
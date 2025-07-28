import type { ReminderSchedule, ReminderScheduleClientData } from '@/lib/actions/reminder-schedules';
import type { ReminderScheduleData } from '@/components/reminders/reminder-scheduler';

/**
 * Maps a ReminderSchedule object (database row format) to 
 * the Partial<ReminderScheduleData> format expected by the ReminderScheduler component.
 * 
 * @param schedule - The ReminderSchedule object from the database, or null.
 * @returns A Partial<ReminderScheduleData> object or undefined if the input is null.
 */
export const mapDbToSchedulerData = (
    schedule: ReminderSchedule | null
): Partial<ReminderScheduleData> | undefined => {
    if (!schedule) return undefined;
    return {
        rruleString: schedule.rrule, 
        timeOfDay: schedule.time_of_day, 
        startDate: schedule.start_date ? new Date(schedule.start_date) : new Date(), 
        endDate: schedule.end_date ? new Date(schedule.end_date) : null,
        isActive: schedule.is_active,
        default_value: schedule.default_value,
    };
};

/**
 * Maps ReminderScheduleData (from the Scheduler component) to 
 * ReminderScheduleClientData (the format expected by the server action).
 * 
 * @param data - The ReminderScheduleData object from the scheduler UI.
 * @returns A ReminderScheduleClientData object for the server action.
 */
export const mapSchedulerToClientData = (data: ReminderScheduleData): ReminderScheduleClientData => {
    return {
        rruleString: data.rruleString,
        timeOfDay: data.timeOfDay,
        startDate: data.startDate,
        endDate: data.endDate,
        isActive: data.isActive,
        default_value: data.default_value,
    };
};

// Add other reminder-related utility functions here in the future if needed. 
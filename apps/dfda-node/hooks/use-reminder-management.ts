'use client'

import { useState, useCallback, useEffect } from 'react'
import { toast as sonnerToast } from 'sonner'
import { useToast } from '@/components/ui/use-toast'
import { logger } from '@/lib/logger'
import { 
  getReminderSchedulesForUserVariableAction,
  upsertReminderScheduleAction,
  deleteReminderScheduleAction,
  type ReminderSchedule,
  type ReminderScheduleClientData
} from '@/lib/actions/reminder-schedules'
import { type ReminderScheduleData } from '@/components/reminders/reminder-scheduler'
import { mapSchedulerToClientData } from '@/lib/reminder-utils'

export function useReminderManagement(userId: string, globalVariableId: string) {
  const { toast } = useToast()
  const [schedules, setSchedules] = useState<ReminderSchedule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSchedules = useCallback(async () => {
    if (!userId || !globalVariableId) {
        setIsLoading(false);
        setSchedules([]);
        return;
    }
    try {
      setIsLoading(true)
      const fetchedSchedules = await getReminderSchedulesForUserVariableAction(userId, globalVariableId)
      setSchedules(fetchedSchedules)
    } catch (error) {
      console.error('Failed to load schedules:', error)
      sonnerToast.error('Failed to load reminders')
      setSchedules([])
    } finally {
      setIsLoading(false)
    }
  }, [userId, globalVariableId])

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  const createSchedule = useCallback(async (scheduleData: ReminderScheduleData): Promise<ReminderSchedule | null> => {
    const clientData = mapSchedulerToClientData(scheduleData);
    try {
      const result = await upsertReminderScheduleAction(
        globalVariableId, 
        clientData, 
        userId
      );
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to create reminder schedule.');
      }
      
      const newSchedule = result.data;
      setSchedules(prev => [...prev, newSchedule]);
      sonnerToast.success('Reminder created');
      return newSchedule;
      
    } catch (error) {
      console.error('Failed to create schedule:', error)
      sonnerToast.error(`Failed to create reminder: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return null;
    }
  }, [userId, globalVariableId])

  const updateSchedule = useCallback(async (scheduleId: string, scheduleData: ReminderScheduleData): Promise<ReminderSchedule | null> => {
    const clientData = mapSchedulerToClientData(scheduleData);
    try {
      const result = await upsertReminderScheduleAction(
        globalVariableId, 
        clientData, 
        userId, 
        scheduleId
      );
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to update reminder schedule.');
      }

      const updatedSchedule = result.data;
      
      setSchedules(prev => 
        prev.map(schedule => 
          schedule.id === scheduleId 
            ? updatedSchedule
            : schedule
        )
      )
      
      sonnerToast.success('Reminder updated')
      return updatedSchedule
    } catch (error) {
      console.error('Failed to update schedule:', error)
      sonnerToast.error(`Failed to update reminder: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return null;
    }
  }, [userId, globalVariableId])

  const handleDelete = useCallback(async (scheduleId: string) => {
    logger.debug('Attempting to delete schedule', { scheduleId, userId, globalVariableId });
    setIsLoading(true);
    setError(null);
    try {
      const result = await deleteReminderScheduleAction(scheduleId, userId, globalVariableId); 
      if (result.success) {
        toast({ title: "Success", description: "Reminder deleted." });
        setSchedules(prev => prev.filter(s => s.id !== scheduleId));
      } else {
        setError(result.error || 'Failed to delete schedule.');
        toast({ title: "Error", description: result.error || 'Failed to delete schedule.', variant: "destructive" });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(message);
      toast({ title: "Error", description: message, variant: "destructive" });
      logger.error("Error deleting reminder schedule", { error: err, scheduleId });
    } finally {
      setIsLoading(false);
    }
  }, [userId, globalVariableId, toast]);

  return {
    schedules,
    isLoading,
    loadSchedules,
    createSchedule,
    updateSchedule,
    handleDelete
  }
} 
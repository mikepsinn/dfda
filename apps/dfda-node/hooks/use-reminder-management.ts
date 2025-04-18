'use client'

import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
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
  const [schedules, setSchedules] = useState<ReminderSchedule[]>([])
  const [isLoading, setIsLoading] = useState(true)

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
      toast.error('Failed to load reminders')
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
      toast.success('Reminder created');
      return newSchedule;
      
    } catch (error) {
      console.error('Failed to create schedule:', error)
      toast.error(`Failed to create reminder: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
      
      toast.success('Reminder updated')
      return updatedSchedule
    } catch (error) {
      console.error('Failed to update schedule:', error)
      toast.error(`Failed to update reminder: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return null;
    }
  }, [userId, globalVariableId])

  const deleteSchedule = useCallback(async (scheduleId: string): Promise<boolean> => {
    try {
      const result = await deleteReminderScheduleAction(scheduleId, userId)
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete reminder schedule.');
      }
      setSchedules(prev => prev.filter(schedule => schedule.id !== scheduleId))
      toast.success('Reminder deleted')
      return true;
    } catch (error) {
      console.error('Failed to delete schedule:', error)
      toast.error(`Failed to delete reminder: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return false;
    }
  }, [userId])

  return {
    schedules,
    isLoading,
    loadSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule
  }
} 
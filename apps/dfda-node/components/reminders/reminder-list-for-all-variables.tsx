'use client'

import { useState, useEffect, useCallback } from 'react'
import { PlusCircle } from 'lucide-react'
import type { ReminderSchedule } from '@/app/actions/reminder-schedules'
import { getAllReminderSchedulesForUserAction } from '@/app/actions/reminder-schedules'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ReminderCard } from './reminder-card'

interface ReminderListForAllVariablesProps {
  userId: string
  userTimezone: string
}

// Define a type for our grouped schedules
interface GroupedSchedule {
  id: string
  name: string
  unitName?: string
  schedules: ReminderSchedule[]
}

export function ReminderListForAllVariables({
  userId
}: ReminderListForAllVariablesProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [schedules, setSchedules] = useState<any[]>([])

  // Load all reminder schedules for the user
  const loadSchedules = useCallback(async () => {
    if (!userId) {
      setIsLoading(false)
      setSchedules([])
      return
    }
    
    try {
      setIsLoading(true)
      const fetchedSchedules = await getAllReminderSchedulesForUserAction(userId)
      setSchedules(fetchedSchedules)
    } catch (error) {
      console.error('Failed to load schedules:', error)
      toast.error('Failed to load reminders')
      setSchedules([])
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    loadSchedules()
  }, [loadSchedules])

  const handleVariableClick = (variableId: string) => {
    router.push(`/patient/reminders/${variableId}`)
  }

  const handleEditReminder = (scheduleId: string, variableId: string) => {
    router.push(`/patient/reminders/${variableId}`)
  }

  const handleDeleteReminder = (scheduleId: string) => {
    // Just navigate to the variable page where they can delete it
    const schedule = schedules.find(s => s.id === scheduleId)
    if (schedule) {
      router.push(`/patient/reminders/${schedule.user_variables.id}`)
    }
  }

  // Group schedules by variable
  const groupedSchedules = schedules.reduce<Record<string, GroupedSchedule>>((acc, schedule) => {
    const varId = schedule.user_variables.id
    const varName = schedule.user_variables.global_variables.name
    
    if (!acc[varId]) {
      acc[varId] = {
        id: varId,
        name: varName,
        unitName: schedule.user_variables.units?.abbreviated_name || schedule.user_variables.global_variables.default_unit?.abbreviated_name,
        schedules: []
      }
    }
    
    acc[varId].schedules.push(schedule)
    return acc
  }, {})

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="py-3 flex justify-center">
          <div className="text-muted-foreground">Loading reminders...</div>
        </div>
      ) : Object.keys(groupedSchedules).length === 0 ? (
        <div className="py-4 flex flex-col items-center justify-center text-center border rounded-md">
          <PlusCircle className="h-8 w-8 text-muted-foreground mb-2" />
          <h3 className="text-sm font-semibold mb-1">No reminders set</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Create a reminder to track your treatments or symptoms
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Object.values(groupedSchedules).map((group: GroupedSchedule) => (
            <Card key={group.id} className="overflow-hidden">
              <CardHeader className="p-4 pb-2 cursor-pointer" onClick={() => handleVariableClick(group.id)}>
                <CardTitle className="text-md font-medium">{group.name}</CardTitle>
              </CardHeader>
              
              <CardContent className="p-4 pt-0">
                <div className="grid gap-3">
                  {group.schedules.map((schedule: ReminderSchedule) => (
                    <ReminderCard
                      key={schedule.id}
                      schedule={schedule}
                      unitName={group.unitName}
                      onEdit={() => handleEditReminder(schedule.id, group.id)}
                      onDelete={() => handleDeleteReminder(schedule.id)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 
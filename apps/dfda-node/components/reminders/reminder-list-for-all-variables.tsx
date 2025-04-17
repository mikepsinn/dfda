'use client'

import { useState, useEffect } from 'react'
import { PlusCircle } from 'lucide-react'
import type { ReminderSchedule } from '@/app/actions/reminder-schedules'
import { getAllReminderSchedulesForUserAction } from '@/app/actions/reminder-schedules'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

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
  const loadSchedules = async () => {
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
  }

  useEffect(() => {
    loadSchedules()
  }, [userId])

  const handleVariableClick = (variableId: string) => {
    router.push(`/patient/reminders/${variableId}`)
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.values(groupedSchedules).map((group: GroupedSchedule) => (
            <div 
              key={group.id} 
              className="border rounded-md p-3 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => handleVariableClick(group.id)}
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium">{group.name}</h3>
              </div>
              
              <div className="grid gap-2 grid-cols-1">
                {group.schedules.map((schedule: ReminderSchedule) => (
                  <div 
                    key={schedule.id} 
                    className="flex justify-between items-center p-2 bg-muted/30 rounded-sm text-xs"
                  >
                    <div>
                      <div className="font-medium">{schedule.time_of_day}</div>
                      <div className="text-muted-foreground text-[10px]">
                        {schedule.is_active ? 'Active' : 'Inactive'} 
                        {schedule.default_value !== null && schedule.default_value !== undefined && 
                          ` • Default: ${schedule.default_value}${group.unitName ? ` ${group.unitName}` : ''}`
                        }
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 
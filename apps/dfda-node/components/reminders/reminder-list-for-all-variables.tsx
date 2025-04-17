'use client'

import { useState, useEffect, useCallback } from 'react'
import { PlusCircle } from 'lucide-react'
import type { ReminderSchedule } from '@/app/actions/reminder-schedules'
import { getAllReminderSchedulesForUserAction } from '@/app/actions/reminder-schedules'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ReminderCard } from './reminder-card'
import { VARIABLE_CATEGORIES_DATA } from '@/lib/constants/variable-categories'

interface ReminderListForAllVariablesProps {
  userId: string
  userTimezone: string
}

// Define a type for our grouped schedules
interface GroupedSchedule {
  id: string
  name: string
  emoji: string
  unitName: string
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

  // Group schedules by variable
  const groupedSchedules = schedules.reduce<Record<string, GroupedSchedule>>((acc, schedule) => {
    const varId = schedule.user_variables.id
    const varName = schedule.user_variables.global_variables.name
    
    // Get emoji from global variable or its category
    const globalVarEmoji = schedule.user_variables.global_variables.emoji
    const categoryId = schedule.user_variables.global_variables.variable_category_id
    const categoryEmoji = categoryId ? VARIABLE_CATEGORIES_DATA[categoryId]?.emoji : undefined
    
    // Use global variable emoji if available, otherwise use the category emoji
    const emoji = globalVarEmoji || categoryEmoji || '📅'
    
    const unitName = schedule.user_variables.units?.abbreviated_name || 
                     schedule.user_variables.global_variables.default_unit?.abbreviated_name || 
                     '' // Empty string if no unit available
    
    if (!acc[varId]) {
      acc[varId] = {
        id: varId,
        name: varName,
        emoji: emoji,
        unitName: unitName,
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
              <CardHeader 
                className="p-4 pb-2 cursor-pointer hover:bg-muted/10 transition-colors" 
                onClick={() => handleVariableClick(group.id)}
              >
                <CardTitle className="text-md font-medium">
                  {group.emoji && <span className="mr-2">{group.emoji}</span>}
                  {group.name}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="p-4 pt-0">
                <div className="grid gap-3">
                  {group.schedules.map((schedule: ReminderSchedule) => (
                    <ReminderCard
                      key={schedule.id}
                      schedule={schedule}
                      unitName={group.unitName}
                      emoji={group.emoji}
                      onClick={() => handleVariableClick(group.id)}
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
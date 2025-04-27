'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { PlusCircle } from 'lucide-react'
import { ReminderDialog } from './reminder-dialog'
import { useReminderManagement } from '@/hooks/use-reminder-management'
import type { ReminderSchedule } from '@/lib/actions/reminder-schedules'
import { ReminderCardList } from './reminder-card-list'
import { VARIABLE_CATEGORIES_DATA } from '@/lib/constants/variable-categories'

interface ReminderListProps {
  userId: string
  userVariableId: string // Renamed from variableId
  variableName: string
  unitName: string
  userTimezone: string
  variableCategoryId?: string
}

// Renamed component
export function ReminderListForUserVariable({ 
  userId, 
  userVariableId, // Renamed from variableId
  variableName,
  unitName, 
  userTimezone,
  variableCategoryId
}: ReminderListProps) {
  const [selectedSchedule, setSelectedSchedule] = useState<ReminderSchedule | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const { 
    schedules, 
    isLoading, 
    loadSchedules
  } = useReminderManagement(userId, userVariableId) // Use userVariableId here

  const handleAddClick = () => {
    setSelectedSchedule(null)
    setIsDialogOpen(true)
  }

  const handleEditClick = (scheduleId: string) => {
    const scheduleToEdit = schedules.find(s => s.id === scheduleId);
    if (scheduleToEdit) {
        setSelectedSchedule(scheduleToEdit)
        setIsDialogOpen(true)
    } else {
        // Log using logger
        console.error("Could not find schedule to edit with ID:", scheduleId);
    }
  }

  const handleDialogClose = (refresh?: boolean) => {
      setIsDialogOpen(false);
      setSelectedSchedule(null);
      if (refresh) {
          loadSchedules();
      }
  }

  // Determine emoji based on variable category
  const categoryEmoji = variableCategoryId ? VARIABLE_CATEGORIES_DATA[variableCategoryId]?.emoji : undefined
  const emoji = categoryEmoji || '📅'  // Default calendar emoji if no category 

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Reminders</h3>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-1"
          onClick={handleAddClick}
        >
          <PlusCircle className="h-4 w-4" />
          <span>Add</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="py-8 flex justify-center">
          <div className="text-muted-foreground">Loading reminders...</div>
        </div>
      ) : schedules.length === 0 ? (
        <div className="py-8 flex flex-col items-center justify-center text-center border rounded-md">
          <PlusCircle className="h-10 w-10 text-muted-foreground mb-3" />
          <h3 className="text-md font-semibold mb-1">No reminders set</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {`Add your first reminder for ${emoji} ${variableName}`}
          </p>
          <Button onClick={handleAddClick} size="sm">
            Add reminder
          </Button>
        </div>
      ) : (
        <ReminderCardList
          schedules={schedules}
          unitName={unitName}
          onClick={handleEditClick}
        />
      )}

      <ReminderDialog
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        userVariableId={userVariableId}
        userId={userId}
        variableName={variableName}
        existingSchedule={selectedSchedule}
        userTimezone={userTimezone}
        unitName={unitName}
      />
    </div>
  )
} 
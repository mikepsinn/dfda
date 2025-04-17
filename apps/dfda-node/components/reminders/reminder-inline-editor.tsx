'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { ReminderScheduler, type ReminderScheduleData } from './reminder-scheduler'
import { Plus, Save, X } from 'lucide-react'
import { ReminderCardList } from './reminder-card-list'
import type { ReminderSchedule } from '@/app/actions/reminder-schedules'
import { logger } from '@/lib/logger'
import { mapDbToSchedulerData } from '@/lib/reminder-utils'

interface ReminderInlineEditorProps {
  schedules: ReminderSchedule[]
  variableName: string
  unitName: string
  onSave: (schedule: ReminderScheduleData) => Promise<ReminderSchedule | null>
  onUpdate: (id: string, schedule: ReminderScheduleData) => Promise<ReminderSchedule | null>
  onDelete: (id: string) => Promise<boolean>
  defaultValue?: number | null
  userTimezone: string
  emoji?: string
}

export function ReminderInlineEditor({
  schedules,
  variableName,
  unitName,
  onSave,
  onUpdate,
  onDelete,
  defaultValue,
  userTimezone,
  emoji = '📅'
}: ReminderInlineEditorProps) {
  const [editingSchedule, setEditingSchedule] = useState<ReminderSchedule | null>(null)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [accordionValue, setAccordionValue] = useState<string>('')
  const [currentSchedulerData, setCurrentSchedulerData] = useState<ReminderScheduleData | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const handleSchedulerChange = useCallback((schedulerData: ReminderScheduleData) => {
      logger.debug('handleSchedulerChange triggered', { data: schedulerData });
      setCurrentSchedulerData(schedulerData);
      setHasChanges(true);
  }, []);

  const handleSaveChanges = useCallback(async () => {
    if (!currentSchedulerData) {
        logger.warn('Save clicked but no scheduler data available');
        return;
    }
    logger.debug('handleSaveChanges triggered', { editingScheduleId: editingSchedule?.id, isAddingNew });
    let success = false;
    if (editingSchedule) {
      const result = await onUpdate(editingSchedule.id, currentSchedulerData)
      success = !!result; 
    } else {
      const result = await onSave(currentSchedulerData)
      success = !!result; 
    }
    
    if (success) {
      setEditingSchedule(null) 
      setIsAddingNew(false)
      setCurrentSchedulerData(null);
      setHasChanges(false);
      setAccordionValue('')
    }
  }, [editingSchedule, isAddingNew, onSave, onUpdate, currentSchedulerData]);

  const handleCancel = () => {
    logger.debug('handleCancel triggered');
    setEditingSchedule(null)
    setIsAddingNew(false)
    setCurrentSchedulerData(null);
    setHasChanges(false);
    setAccordionValue('')
  }

  const handleEditClick = useCallback((scheduleId: string) => { 
    const scheduleToEdit = schedules.find(s => s.id === scheduleId);
    if (scheduleToEdit) {
        logger.debug('handleEdit triggered', { scheduleId: scheduleToEdit.id });
        setEditingSchedule(scheduleToEdit)
        setIsAddingNew(false)
        setCurrentSchedulerData(null); 
        setHasChanges(false); 
        setAccordionValue('reminder-editor')
    } else {
        logger.error("Could not find schedule to edit with ID:", scheduleId);
    }
  }, [schedules]);

  const handleClickAdd = () => {
    logger.debug('handleClickAdd triggered');
    setEditingSchedule(null)
    setIsAddingNew(true)
    setCurrentSchedulerData(null);
    setHasChanges(false);
    setAccordionValue('reminder-editor')
  }

  const initialSchedulerData = mapDbToSchedulerData(editingSchedule);
  
  const newScheduleDefaults: Partial<ReminderScheduleData> = {
    timeOfDay: '09:00',
    rruleString: 'FREQ=DAILY',
    startDate: new Date(),
    isActive: true,
    default_value: defaultValue
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {schedules.length === 0
            ? "No scheduled reminders"
            : `${schedules.length} reminder${schedules.length === 1 ? '' : 's'}`}
        </div>
        <Button variant="outline" size="sm" onClick={handleClickAdd} disabled={isAddingNew || !!editingSchedule}>
          <Plus className="h-4 w-4 mr-2" />
          Add reminder
        </Button>
      </div>

      {schedules.length > 0 && (
        <ReminderCardList 
           schedules={schedules}
           unitName={unitName}
           onClick={handleEditClick}
        />
      )}

      <Accordion 
        type="single" 
        collapsible 
        value={accordionValue} 
        onValueChange={setAccordionValue}
        className="overflow-hidden"
      >
        {(isAddingNew || editingSchedule) && (
           <AccordionItem value="reminder-editor" className="border-none">
             <AccordionTrigger className="hidden"></AccordionTrigger>
             <AccordionContent forceMount> 
               <div className="p-4 border rounded-md mt-2 space-y-4">
                 <h4 className="text-md font-medium">{isAddingNew ? 'Add New Reminder' : 'Edit Reminder'}</h4>
                 <ReminderScheduler
                   key={editingSchedule?.id || 'new'}
                   initialSchedule={editingSchedule ? initialSchedulerData : newScheduleDefaults}
                   onChange={handleSchedulerChange}
                   userTimezone={userTimezone}
                   unitName={unitName}
                   variableName={variableName}
                 />
                 <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="outline" size="sm" onClick={handleCancel}>
                       <X className="h-4 w-4 mr-1"/> Cancel
                    </Button>
                    <Button size="sm" onClick={handleSaveChanges} disabled={!hasChanges}>
                       <Save className="h-4 w-4 mr-1"/> {isAddingNew ? 'Add Reminder' : 'Save Changes'}
                    </Button>
                 </div>
               </div>
             </AccordionContent>
           </AccordionItem>
        )}
      </Accordion>
    </div>
  )
} 
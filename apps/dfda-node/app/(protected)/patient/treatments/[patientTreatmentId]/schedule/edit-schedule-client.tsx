'use client' // Need client component to handle scheduler's onChange

import React, { useState, useCallback } from 'react'
import { ReminderScheduler, type ReminderScheduleData } from '@/components/reminder-scheduler'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { logger } from '@/lib/logger'
import { Plus, X, Edit, Clock, Save, CheckCircle } from 'lucide-react'
import { upsertReminderScheduleAction, deleteReminderScheduleAction } from '@/app/actions/reminder-schedules'
import { format } from 'date-fns'
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface EditScheduleClientProps {
    patientTreatmentId: string;
    userVariableId: string;
    scheduleData: (ReminderScheduleData & { id: string })[];
    treatmentName: string;
    userTimezone: string;
}

export default function EditScheduleClient({ 
    patientTreatmentId, 
    userVariableId,
    scheduleData,
    treatmentName, 
    userTimezone
}: EditScheduleClientProps) {
  const [schedules, setSchedules] = useState<(ReminderScheduleData & { id: string })[]>(scheduleData || []);
  const [activeSchedule, setActiveSchedule] = useState<(ReminderScheduleData & { id?: string }) | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();

  // Handler for ReminderScheduler changes
  const handleScheduleChange = useCallback((newSchedule: ReminderScheduleData) => {
    logger.debug('Schedule changed in scheduler component', { newSchedule });
    setActiveSchedule(prev => ({
      ...newSchedule,
      id: prev?.id
    }));
  }, []);

  // Add a new schedule
  const handleAddSchedule = () => {
    // Initialize with default values
    const defaultSchedule: ReminderScheduleData = {
      rruleString: 'DTSTART:20240101T000000Z\nRRULE:FREQ=DAILY;INTERVAL=1',
      timeOfDay: '09:00',
      startDate: new Date(),
      endDate: null,
      isActive: true,
    };
    
    setActiveSchedule(defaultSchedule);
    setIsEditMode(true);
    setEditingId(null);
  };

  // Edit an existing schedule
  const handleEditSchedule = (schedule: ReminderScheduleData & { id: string }) => {
    setActiveSchedule(schedule);
    setIsEditMode(true);
    setEditingId(schedule.id);
  };

  // Delete a schedule
  const handleDeleteSchedule = async (scheduleId: string) => {
    try {
      setIsSaving(true);
      const result = await deleteReminderScheduleAction(scheduleId, userVariableId);
      
      if (result.success) {
        // Remove from local state
        setSchedules(prev => prev.filter(s => s.id !== scheduleId));
        toast({ 
          title: "Schedule Deleted", 
          description: `Reminder time removed.` 
        });
      } else {
        throw new Error(result.error || 'Failed to delete schedule');
      }
    } catch (error: any) {
      logger.error('Failed to delete schedule', { scheduleId, error: error.message });
      toast({ 
        title: "Delete Failed", 
        description: error.message || "Could not delete this reminder time.", 
        variant: "destructive" 
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Save the current schedule
  const handleSaveSchedule = async () => {
    if (!activeSchedule) {
      toast({ 
        title: "Error", 
        description: "No schedule data to save.", 
        variant: "destructive" 
      });
      return;
    }

    setIsSaving(true);
    
    try {
      const result = await upsertReminderScheduleAction(
        userVariableId,
        activeSchedule, 
        userVariableId,
        editingId
      );
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to save schedule');
      }
      
      // Update local state
      if (editingId) {
        // Update existing
        setSchedules(prev => prev.map(s => 
          s.id === editingId ? { ...activeSchedule, id: result.data!.id } : s
        ));
      } else {
        // Add new
        setSchedules(prev => [
          ...prev, 
          { ...activeSchedule, id: result.data!.id }
        ]);
      }
      
      toast({ 
        title: "Schedule Saved", 
        description: `Reminder time for ${treatmentName} saved.`
      });
      
      // Reset state
      setActiveSchedule(null);
      setIsEditMode(false);
      setEditingId(null);
    } catch (error: any) {
      logger.error('Failed to save schedule', { patientTreatmentId, error: error.message });
      toast({ 
        title: "Save Failed", 
        description: error.message || "Could not update the schedule.", 
        variant: "destructive" 
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setActiveSchedule(null);
    setIsEditMode(false);
    setEditingId(null);
  };

  // Format the schedule for display
  const formatSchedule = (schedule: ReminderScheduleData) => {
    const timeStr = schedule.timeOfDay;
    const [hours, minutes] = timeStr.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    
    const formattedTime = format(date, 'h:mm a');
    
    // Format frequency based on rrule (simplified)
    let frequency = "daily";
    if (schedule.rruleString.includes('FREQ=WEEKLY')) {
      frequency = "weekly";
    } else if (schedule.rruleString.includes('FREQ=MONTHLY')) {
      frequency = "monthly";
    }
    
    return {
      time: formattedTime,
      frequency
    };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Treatment Reminder Schedule</CardTitle>
        <CardDescription>
          Set up multiple reminders for {treatmentName}. 
          Add different times of day to be reminded to take this treatment.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* List of existing schedules */}
        {schedules.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Current reminder times:</h3>
            <ul className="space-y-2">
              {schedules.map(schedule => {
                const { time, frequency } = formatSchedule(schedule);
                return (
                  <li key={schedule.id} className="flex justify-between items-center p-3 border rounded-md bg-muted/30">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        <span className="font-medium">{time}</span>
                        <span className="ml-2 text-sm text-muted-foreground">({frequency})</span>
                        {schedule.isActive ? (
                          <span className="ml-2 text-xs text-green-600 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" /> Active
                          </span>
                        ) : (
                          <span className="ml-2 text-xs text-gray-400">Inactive</span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleEditSchedule(schedule)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <X className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this reminder?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete the {time} reminder for {treatmentName}?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteSchedule(schedule.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <div className="text-center p-6 border border-dashed rounded-md text-muted-foreground">
            No reminders set for this treatment. 
            Click "Add Reminder Time" to set a reminder.
          </div>
        )}

        {/* Edit Mode */}
        {isEditMode && activeSchedule && (
          <Accordion type="single" collapsible defaultValue="schedule">
            <AccordionItem value="schedule">
              <AccordionTrigger className="text-sm font-medium">
                {editingId ? 'Edit Reminder' : 'Add New Reminder Time'}
              </AccordionTrigger>
              <AccordionContent>
                <div className="p-4 border rounded-md mt-2 bg-card">
                  <ReminderScheduler
                    initialSchedule={activeSchedule}
                    onChange={handleScheduleChange}
                    userTimezone={userTimezone}
                  />
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                    <Button 
                      variant="default" 
                      onClick={handleSaveSchedule} 
                      disabled={isSaving || !activeSchedule}
                    >
                      {isSaving ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </CardContent>

      <CardFooter className="flex justify-end">
        {!isEditMode && (
          <Button onClick={handleAddSchedule} disabled={isSaving}>
            <Plus className="mr-2 h-4 w-4" />
            Add Reminder Time
          </Button>
        )}
      </CardFooter>
    </Card>
  );
} 
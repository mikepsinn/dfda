'use client' // Need client component to handle scheduler's onChange

import React, { useState, useCallback } from 'react'
import { ReminderScheduler, type ReminderScheduleData } from '@/components/reminders'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { logger } from '@/lib/logger'
import { Plus, X, Edit, Clock, Save, CheckCircle } from 'lucide-react'
import { upsertReminderScheduleAction, deleteReminderScheduleAction } from '@/app/actions/reminder-schedules'
import { format } from 'date-fns'
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
    userId: string;
}

export default function EditScheduleClient({ 
    patientTreatmentId, 
    userVariableId,
    scheduleData,
    treatmentName, 
    userTimezone,
    userId
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
      const result = await deleteReminderScheduleAction(scheduleId, userId);
      
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
        userId,
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
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">Treatment Reminder Schedule</CardTitle>
        <CardDescription>
          Set up multiple reminders for {treatmentName} throughout the day.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* List of existing schedules */}
        {schedules.length > 0 ? (
          <div>
            <h3 className="text-sm font-medium mb-3">Reminder times:</h3>
            <div className="space-y-2">
              {schedules.map(schedule => {
                const { time, frequency } = formatSchedule(schedule);
                const isEditing = isEditMode && editingId === schedule.id;
                
                return (
                  <div key={schedule.id} className="border border-muted rounded-md">
                    {/* Reminder card */}
                    <div className="flex justify-between items-center p-3 rounded-md bg-muted/40">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-full">
                          <Clock className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{time}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <span>{frequency}</span>
                            {schedule.isActive && (
                              <span className="inline-flex items-center text-emerald-600">
                                <CheckCircle className="h-3 w-3 mr-1" /> Active
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleEditSchedule(schedule)}
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <X className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
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
                              <AlertDialogAction 
                                onClick={() => handleDeleteSchedule(schedule.id)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    
                    {/* Inline edit form */}
                    {isEditing && activeSchedule && (
                      <div className="p-4 border-t bg-card/50">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-medium">Edit Reminder</h3>
                          <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <ReminderScheduler
                          initialSchedule={activeSchedule}
                          onChange={handleScheduleChange}
                          userTimezone={userTimezone}
                        />
                        <div className="flex justify-end mt-4">
                          <Button 
                            variant="default" 
                            onClick={handleSaveSchedule} 
                            disabled={isSaving || !activeSchedule}
                            className="gap-2"
                          >
                            {isSaving ? (
                              <>Saving...</>
                            ) : (
                              <>
                                <Save className="h-4 w-4" />
                                Save Changes
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 border border-dashed rounded-md text-muted-foreground">
            <Clock className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
            <p>No reminders set for this treatment.</p>
            <p className="text-sm">Add your first reminder to get started.</p>
          </div>
        )}

        {/* Add new reminder form (only when adding new, not editing) */}
        {isEditMode && !editingId && activeSchedule && (
          <div className="mt-6 border rounded-md bg-card p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Add New Reminder</h3>
              <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <ReminderScheduler
              initialSchedule={activeSchedule}
              onChange={handleScheduleChange}
              userTimezone={userTimezone}
            />
            <div className="flex justify-end mt-4">
              <Button 
                variant="default" 
                onClick={handleSaveSchedule} 
                disabled={isSaving || !activeSchedule}
                className="gap-2"
              >
                {isSaving ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Reminder
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t pt-6">
        {schedules.length > 0 && !isEditMode ? (
          <p className="text-sm text-muted-foreground">
            {schedules.length} reminder{schedules.length !== 1 ? 's' : ''} configured
          </p>
        ) : (
          <div></div> // Empty div to maintain space
        )}
        
        {!isEditMode && (
          <Button onClick={handleAddSchedule} className="gap-2" disabled={isSaving}>
            <Plus className="h-4 w-4" />
            Add Reminder
          </Button>
        )}
      </CardFooter>
    </Card>
  );
} 
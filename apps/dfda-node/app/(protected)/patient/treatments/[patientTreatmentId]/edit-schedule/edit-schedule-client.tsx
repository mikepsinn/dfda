'use client' // Need client component to handle scheduler's onChange

import React, { useState, useCallback } from 'react'
import { ReminderScheduler, type ReminderScheduleData } from '@/components/reminder-scheduler'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { logger } from '@/lib/logger'
// Assume an action exists to save the schedule
// import { updatePatientTreatmentScheduleAction } from '@/app/actions/patient-treatments' 

interface EditScheduleClientProps {
    patientTreatmentId: string;
    // We would fetch initial schedule data in the parent server component and pass it here
    initialScheduleData?: Partial<ReminderScheduleData>; 
    treatmentName: string; // For display
    userTimezone: string; // <-- Add user timezone prop
}

export default function EditScheduleClient({ 
    patientTreatmentId, 
    initialScheduleData, 
    treatmentName, 
    userTimezone // <-- Destructure user timezone prop
}: EditScheduleClientProps) {
  // currentSchedule state no longer contains timezone
  const [currentSchedule, setCurrentSchedule] = useState<Omit<ReminderScheduleData, 'timezone'> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Callback from ReminderScheduler no longer includes timezone
  const handleScheduleChange = useCallback((newSchedule: Omit<ReminderScheduleData, 'timezone'>) => {
    logger.debug('Schedule changed in scheduler component', { newSchedule });
    setCurrentSchedule(newSchedule);
  }, []);

  const handleSave = async () => {
    if (!currentSchedule) {
        toast({ title: "Error", description: "No schedule data to save.", variant: "destructive" });
        return;
    }
    setIsSaving(true);
    // The saved payload no longer contains timezone
    logger.info('Attempting to save schedule', { patientTreatmentId, schedule: currentSchedule });
    
    try {
        // --- Placeholder for calling the save action --- 
        // The action would also need modification to not expect/save timezone
        // const result = await updatePatientTreatmentScheduleAction(patientTreatmentId, currentSchedule);
        // if (!result.success) { throw new Error(result.error || 'Failed to save schedule') }
        console.log("--- SIMULATING SAVE --- PatientTreatmentId:", patientTreatmentId, "Schedule:", currentSchedule);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
        // --- End Placeholder --- 

        toast({ title: "Schedule Saved", description: `Reminder schedule for ${treatmentName} updated.` });
        // Optionally, redirect back or refresh data
        // router.push(`/patient/treatments/${patientTreatmentId}`);
    } catch (error: any) {
        logger.error('Failed to save schedule', { patientTreatmentId, error: error.message });
        toast({ title: "Save Failed", description: error.message || "Could not update the schedule.", variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Reminder Schedule</CardTitle>
        <CardDescription>Set up reminders for {treatmentName}.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <ReminderScheduler
          initialSchedule={initialScheduleData}
          onChange={handleScheduleChange}
          userTimezone={userTimezone} // <-- Pass timezone down
        />
        <div className="flex justify-end">
             <Button onClick={handleSave} disabled={isSaving || !currentSchedule}>
                {isSaving ? "Saving..." : "Save Schedule"}
             </Button>
        </div>
      </CardContent>
    </Card>
  )
} 
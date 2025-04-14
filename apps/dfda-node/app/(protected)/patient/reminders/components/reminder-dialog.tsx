'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { useToast } from "@/components/ui/use-toast"
import { ReminderScheduler, type ReminderScheduleData } from '@/components/reminder-scheduler'
import {
    getReminderSchedulesForUserVariableAction,
    upsertReminderScheduleAction,
    deleteReminderScheduleAction,
    type ReminderSchedule,
    type ReminderScheduleClientData,
} from '@/app/actions/reminder-schedules'
import { createLogger } from '@/lib/logger'
import { Loader2 } from 'lucide-react'

const logger = createLogger("reminder-dialog")

export type ReminderDialogProps = {
    isOpen: boolean;
    onClose: (refresh?: boolean) => void;
    userVariableId: string;
    userId: string;
    variableName: string;
    existingSchedule: ReminderSchedule | null; // Schedule to edit, or null for new
};

export function ReminderDialog({ 
    isOpen, 
    onClose, 
    userVariableId, 
    userId, 
    variableName, 
    existingSchedule 
}: ReminderDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [currentScheduleData, setCurrentScheduleData] = useState<ReminderScheduleData | null>(null);
    const { toast } = useToast();

    // Use existingSchedule prop to initialize the form when dialog opens
    useEffect(() => {
        if (isOpen) {
             logger.info('ReminderDialog opened', { existingScheduleId: existingSchedule?.id });
             // Reset internal state when opening
             setCurrentScheduleData(null); 
             setIsLoading(false); // Reset loading states
             setIsDeleting(false);
        } else {
             // Optional: Reset internal state when closing if needed
             // setCurrentScheduleData(null);
        }
    }, [isOpen, existingSchedule]); // Depend on isOpen and existingSchedule

    const handleScheduleChange = useCallback((newData: ReminderScheduleData) => {
        logger.debug('Schedule data changed in dialog', { userVariableId });
        setCurrentScheduleData(newData);
    }, [userVariableId]);

    const handleSave = async () => {
        if (!currentScheduleData) {
            // If initial data was loaded but no changes made, maybe allow closing?
            // Or indicate no changes.
            toast({ title: "Info", description: "No changes detected." });
            return;
        }
        setIsLoading(true);
        logger.info('Saving schedule', { userVariableId, scheduleId: existingSchedule?.id });
        try {
            const result = await upsertReminderScheduleAction(
                userVariableId,
                currentScheduleData,
                userId,
                existingSchedule?.id // Pass existing ID if updating
            );

            if (result.success && result.data) {
                toast({ title: "Success", description: result.message || 'Reminder schedule saved.' });
                onClose(true); // Close dialog and signal refresh
            } else {
                logger.error('Error saving schedule', { userVariableId, error: result.error });
                toast({ title: "Error", description: result.error || 'Failed to save reminder schedule.', variant: "destructive" });
            }
        } catch (error) {
            logger.error('Exception saving schedule', { userVariableId, error });
            toast({ title: "Error", description: 'An unexpected error occurred while saving.', variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!existingSchedule?.id) return;

        if (!confirm('Are you sure you want to delete this reminder schedule?')) {
            return;
        }

        setIsDeleting(true);
        logger.warn('Attempting to delete schedule', { scheduleId: existingSchedule.id });
        try {
            const result = await deleteReminderScheduleAction(existingSchedule.id, userId);
            if (result.success) {
                toast({ title: "Success", description: 'Reminder schedule deleted.' });
                onClose(true); // Close dialog and signal refresh
            } else {
                logger.error('Error deleting schedule', { scheduleId: existingSchedule.id, error: result.error });
                toast({ title: "Error", description: result.error || 'Failed to delete schedule.', variant: "destructive" });
            }
        } catch (error) {
            logger.error('Exception deleting schedule', { scheduleId: existingSchedule.id, error });
            toast({ title: "Error", description: 'An unexpected error occurred while deleting.', variant: "destructive" });
        } finally {
            setIsDeleting(false);
        }
    }

    // Map ReminderSchedule (DB format) to ReminderScheduleData (Scheduler component format)
    const mapToSchedulerData = (schedule: ReminderSchedule | null): Partial<ReminderScheduleData> | undefined => {
        if (!schedule) return undefined;
        return {
            rruleString: schedule.rrule,
            timeOfDay: schedule.time_of_day,
            timezone: schedule.timezone,
            startDate: schedule.start_date ? new Date(schedule.start_date) : new Date(), // Handle potential null/parse
            endDate: schedule.end_date ? new Date(schedule.end_date) : null,
            isActive: schedule.is_active,
        };
    };
    
    const initialSchedulerData = mapToSchedulerData(existingSchedule);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()} >
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>{existingSchedule ? 'Edit Reminder' : 'Add Reminder'} for: {variableName}</DialogTitle>
                    <DialogDescription>
                        Configure how often you want to be reminded to update this variable.
                    </DialogDescription>
                </DialogHeader>
                {
                    <ReminderScheduler
                        key={existingSchedule?.id || 'new'} // Force re-render when schedule changes
                        initialSchedule={initialSchedulerData} // Pass mapped data
                        onChange={handleScheduleChange}
                        userId={userId}
                    />
                }
                <DialogFooter className='flex justify-between w-full pt-4'>
                   <div>
                     {existingSchedule?.id && (
                         <Button
                             variant="destructive"
                             onClick={handleDelete}
                             disabled={isDeleting || isLoading}
                             size="sm"
                         >
                             {isDeleting ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
                             Delete
                         </Button>
                     )}
                   </div>
                   <div className='flex gap-2'>
                        <Button variant="outline" size="sm" onClick={() => onClose()}>Cancel</Button>
                        <Button
                            onClick={handleSave}
                            disabled={isLoading || isDeleting || !currentScheduleData} // Disable if no changes
                            size="sm"
                        >
                            {isLoading ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
                            {existingSchedule ? 'Save Changes' : 'Create Reminder'}
                        </Button>
                   </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
} 
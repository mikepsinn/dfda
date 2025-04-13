'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { ReminderScheduler } from '@/components/reminder-scheduler'
import {
    getReminderSchedulesForUserVariableAction,
    upsertReminderScheduleAction,
    deleteReminderScheduleAction,
    type ReminderSchedule,
    type ReminderScheduleClientData,
} from '@/app/actions/reminder-schedules'
import { logger } from '@/lib/logger'
import { Loader2 } from 'lucide-react'

type ReminderDialogProps = {
    userVariableId: string;
    userId: string;
    variableName: string;
    children: React.ReactNode; // Trigger element
};

export function ReminderDialog({ userVariableId, userId, variableName, children }: ReminderDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [initialSchedule, setInitialSchedule] = useState<ReminderSchedule | null>(null);
    const [currentScheduleData, setCurrentScheduleData] = useState<ReminderScheduleClientData | null>(null);

    // Fetch initial schedule when dialog opens
    useEffect(() => {
        if (isOpen && userVariableId) {
            setIsLoading(true);
            logger.info('Fetching schedule for dialog', { userVariableId });
            getReminderSchedulesForUserVariableAction(userVariableId)
                .then((schedules) => {
                    // Assuming only one schedule per variable for now
                    if (schedules && schedules.length > 0) {
                        logger.info('Found existing schedule', { scheduleId: schedules[0].id });
                        setInitialSchedule(schedules[0]);
                    } else {
                        logger.info('No existing schedule found');
                        setInitialSchedule(null);
                    }
                })
                .catch((error) => {
                    logger.error('Error fetching schedule', { userVariableId, error });
                    toast.error('Failed to load reminder schedule.');
                    setInitialSchedule(null); // Ensure it's reset on error
                })
                .finally(() => {
                    setIsLoading(false);
                });
        } else {
            // Reset state when closing
            setInitialSchedule(null);
            setCurrentScheduleData(null);
        }
    }, [isOpen, userVariableId]);

    const handleScheduleChange = useCallback((newData: ReminderScheduleClientData) => {
        logger.debug('Schedule data changed in dialog', { userVariableId });
        setCurrentScheduleData(newData);
    }, [userVariableId]);

    const handleSave = async () => {
        if (!currentScheduleData) {
            toast.warning('No changes detected.');
            return;
        }
        setIsLoading(true);
        logger.info('Saving schedule', { userVariableId, scheduleId: initialSchedule?.id });
        try {
            const result = await upsertReminderScheduleAction(
                userVariableId,
                currentScheduleData,
                userId,
                initialSchedule?.id // Pass existing ID if updating
            );

            if (result.success && result.data) {
                toast.success(result.message || 'Reminder schedule saved.');
                setInitialSchedule(result.data); // Update initial state with saved data
                setCurrentScheduleData(null); // Reset changes
                setIsOpen(false); // Close dialog on success
            } else {
                logger.error('Error saving schedule', { userVariableId, error: result.error });
                toast.error(result.error || 'Failed to save reminder schedule.');
            }
        } catch (error) {
            logger.error('Exception saving schedule', { userVariableId, error });
            toast.error('An unexpected error occurred while saving.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!initialSchedule?.id) return;

        setIsDeleting(true);
        logger.warn('Attempting to delete schedule', { scheduleId: initialSchedule.id });
        try {
            const result = await deleteReminderScheduleAction(initialSchedule.id, userId);
            if (result.success) {
                toast.success('Reminder schedule deleted.');
                setInitialSchedule(null);
                setCurrentScheduleData(null);
                setIsOpen(false);
            } else {
                logger.error('Error deleting schedule', { scheduleId: initialSchedule.id, error: result.error });
                toast.error(result.error || 'Failed to delete schedule.');
            }
        } catch (error) {
            logger.error('Exception deleting schedule', { scheduleId: initialSchedule.id, error });
            toast.error('An unexpected error occurred while deleting.');
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Set Reminder for: {variableName}</DialogTitle>
                    <DialogDescription>
                        Configure how often you want to be reminded to update this variable.
                    </DialogDescription>
                </DialogHeader>
                {isLoading && !initialSchedule && (
                    <div className="flex justify-center items-center h-40">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                )}
                {!isLoading && (
                    <ReminderScheduler
                        key={initialSchedule?.id || 'new'} // Force re-render when schedule changes
                        initialSchedule={initialSchedule ?? undefined} // Pass undefined if null
                        onChange={handleScheduleChange}
                        userId={userId}
                    />
                )}
                <DialogFooter className='flex justify-between w-full'>
                   <div>
                     {initialSchedule?.id && (
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
                        <DialogClose asChild>
                            <Button variant="outline" size="sm">Cancel</Button>
                        </DialogClose>
                        <Button
                            onClick={handleSave}
                            disabled={isLoading || isDeleting || !currentScheduleData} // Disable if no changes
                            size="sm"
                        >
                            {isLoading ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
                            Save Schedule
                        </Button>
                   </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
} 
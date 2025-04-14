"use client"

import { useState } from 'react'
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Pencil, Trash2, BellRing, BellOff } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { RRule } from 'rrule' // For parsing RRULE to display text
import type { ReminderSchedule } from "@/app/actions/reminder-schedules"
import { deleteReminderScheduleAction, getReminderSchedulesForUserVariableAction } from "@/app/actions/reminder-schedules"
import { createLogger } from "@/lib/logger"
import { ReminderDialog } from './reminder-dialog' // Assuming path

const logger = createLogger("reminders-list-client")

// Helper to get human-readable text from RRULE
function getRRuleText(rruleString: string): string {
  try {
    // Temporarily suppress rrule errors for display
    // @ts-ignore
    const rule = RRule.fromString(rruleString);
    return rule.toText();
  } catch (e) {
    logger.warn("Failed to parse RRULE string for display", { rruleString, e });
    return "Invalid rule";
  }
}

interface RemindersListProps {
   userId: string;
   globalVariableId: string;
   variableName: string;
   initialSchedules: ReminderSchedule[];
}

export function RemindersListClient({ userId, globalVariableId, variableName, initialSchedules }: RemindersListProps) {
   const [schedules, setSchedules] = useState<ReminderSchedule[]>(initialSchedules);
   const [editingSchedule, setEditingSchedule] = useState<ReminderSchedule | null>(null);
   const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
   const { toast } = useToast();

   const handleDelete = async (scheduleId: string) => {
      if (!confirm('Are you sure you want to delete this reminder schedule?')) {
         return;
      }
      let schedulesBeforeDelete = [...schedules]; // Store current state for potential revert
      try {
         // Optimistic update
         setSchedules(prev => prev.filter(s => s.id !== scheduleId));
         const result = await deleteReminderScheduleAction(scheduleId, userId);
         if (!result.success) {
            toast({ title: "Error", description: result.error || "Failed to delete reminder.", variant: "destructive" });
            // Revert optimistic update
            setSchedules(schedulesBeforeDelete);
         } else {
            toast({ title: "Success", description: "Reminder schedule deleted." });
            // No need to update initialSchedules here, state is managed
         }
      } catch (error) {
          logger.error("Error deleting reminder", { scheduleId, error });
          toast({ title: "Error", description: "Could not delete reminder.", variant: "destructive" });
          setSchedules(schedulesBeforeDelete); // Revert
      }
   };

   const handleEdit = (schedule: ReminderSchedule) => {
       setEditingSchedule(schedule);
       // We will reuse the Add/Edit dialog, passing the schedule to edit
       setIsAddDialogOpen(true);
   };

   const handleDialogClose = async (refresh?: boolean) => {
       setIsAddDialogOpen(false);
       setEditingSchedule(null);
       if (refresh) {
           // Refetch schedules after add/edit
           try {
             const updatedSchedules = await getReminderSchedulesForUserVariableAction(globalVariableId)
             setSchedules(updatedSchedules);
             toast({ title: "Refreshed", description: "Reminder list updated." });
           } catch (err) {
               logger.error("Failed to refresh schedules after dialog close", { err });
               toast({ title: "Error", description: "Could not refresh reminders.", variant: "destructive" });
           }
       }
   };

   return (
       <div>
         <div className="flex justify-end mb-4">
            {/* --- Add Reminder Button --- */} 
            <Button onClick={() => { setEditingSchedule(null); setIsAddDialogOpen(true); }}>
               <Plus className="mr-2 h-4 w-4" /> Add Reminder
            </Button>
         </div>

         {/* --- List Existing Reminders --- */} 
         {schedules.length > 0 ? (
            <div className="space-y-4">
               {schedules.map(schedule => (
                  <Card key={schedule.id}>
                     <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
                       <div>
                          <CardTitle className="text-md capitalize">
                             {getRRuleText(schedule.rrule)}
                          </CardTitle>
                           <CardDescription>
                             at {schedule.time_of_day} ({schedule.timezone}) 
                           </CardDescription>
                       </div>
                       <Badge variant={schedule.is_active ? "default" : "secondary"}>
                           {schedule.is_active ? <BellRing className="h-3 w-3 mr-1"/> : <BellOff className="h-3 w-3 mr-1"/>}
                           {schedule.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                     </CardHeader>
                      <CardContent className="flex justify-end gap-2 pt-2">
                           <Button variant="outline" size="sm" onClick={() => handleEdit(schedule)}>
                              <Pencil className="mr-1 h-3 w-3" /> Edit
                           </Button>
                           <Button variant="destructive" size="sm" onClick={() => handleDelete(schedule.id)}>
                              <Trash2 className="mr-1 h-3 w-3" /> Delete
                           </Button>
                      </CardContent>
                  </Card>
               ))}
            </div>
         ) : (
             <p className="text-muted-foreground text-center py-4">No reminder schedules set up for {variableName}.</p>
         )}

          {/* --- Add/Edit Dialog --- */} 
         <ReminderDialog
            isOpen={isAddDialogOpen}
            onClose={handleDialogClose} 
            userId={userId}
            userVariableId={globalVariableId}
            variableName={variableName}
            existingSchedule={editingSchedule}
         />
       </div>
   );
} 
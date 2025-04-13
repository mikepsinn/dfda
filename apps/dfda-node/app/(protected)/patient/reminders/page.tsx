import { getServerUser } from "@/lib/server-auth"
import { redirect } from "next/navigation"
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Pencil, Trash2, BellRing, BellOff } from "lucide-react"
import { getGlobalVariableByIdAction } from "@/app/actions/global-variables"
import { getReminderSchedulesForUserVariableAction, deleteReminderScheduleAction } from "@/app/actions/reminder-schedules"
import type { ReminderSchedule } from "@/app/actions/reminder-schedules"
import { createLogger } from "@/lib/logger"
import { Suspense } from "react"
import { Badge } from "@/components/ui/badge"
import { RRule } from 'rrule' // For parsing RRULE to display text
import { useState } from 'react'
import { useToast } from "@/components/ui/use-toast"

// Import the scheduler dialog component
import { ReminderDialog } from './components/reminder-dialog' // Assuming path

const logger = createLogger("patient-reminders-page")

interface PatientRemindersPageProps {
  searchParams: { variableId?: string };
}

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

// --- Client Component for List/Actions ---
interface RemindersListProps {
   userId: string;
   globalVariableId: string;
   variableName: string;
   initialSchedules: ReminderSchedule[];
}

function RemindersListClient({ userId, globalVariableId, variableName, initialSchedules }: RemindersListProps) {
   "use client"

   const [schedules, setSchedules] = useState<ReminderSchedule[]>(initialSchedules);
   const [editingSchedule, setEditingSchedule] = useState<ReminderSchedule | null>(null);
   const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
   const { toast } = useToast();

   const handleDelete = async (scheduleId: string) => {
      if (!confirm('Are you sure you want to delete this reminder schedule?')) {
         return;
      }
      try {
         // Optimistic update
         setSchedules(prev => prev.filter(s => s.id !== scheduleId));
         const result = await deleteReminderScheduleAction(scheduleId, userId);
         if (!result.success) {
            toast({ title: "Error", description: result.error || "Failed to delete reminder.", variant: "destructive" });
            // Revert optimistic update (refetch might be better)
            setSchedules(initialSchedules); // Simple revert for now
         } else {
            toast({ title: "Success", description: "Reminder schedule deleted." });
            // Update initialSchedules state if needed after successful delete
            initialSchedules = initialSchedules.filter(s => s.id !== scheduleId);
         }
      } catch (error) {
          logger.error("Error deleting reminder", { scheduleId, error });
          toast({ title: "Error", description: "Could not delete reminder.", variant: "destructive" });
          setSchedules(initialSchedules); // Revert
      }
   };

   const handleEdit = (schedule: ReminderSchedule) => {
       setEditingSchedule(schedule);
       // We will reuse the Add/Edit dialog, passing the schedule to edit
       setIsAddDialogOpen(true); 
   };

   const handleDialogClose = (refresh?: boolean) => {
       setIsAddDialogOpen(false);
       setEditingSchedule(null);
       if (refresh) {
           // Refetch schedules after add/edit
           getReminderSchedulesForUserVariableAction(globalVariableId)
              .then(setSchedules)
              .catch(err => logger.error("Failed to refresh schedules after dialog close", { err }));
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


// --- Server Component Page --- 
export default async function PatientRemindersPage({ searchParams }: PatientRemindersPageProps) {
  const user = await getServerUser()
  if (!user) {
    redirect("/login")
  }

  const globalVariableId = searchParams.variableId;
  if (!globalVariableId) {
     logger.warn("Reminder page accessed without variableId (globalVariableId)");
     notFound(); // Need a variable ID to show reminders for
  }

  // Fetch variable details and schedules in parallel
  const [variable, initialSchedules] = await Promise.all([
     getGlobalVariableByIdAction(globalVariableId),
     getReminderSchedulesForUserVariableAction(globalVariableId)
  ]);

  if (!variable) {
     logger.warn("Global variable not found for reminder page", { userId: user.id, globalVariableId });
     notFound(); // Variable not found
  }

  logger.info("Rendering patient reminders page", { userId: user.id, globalVariableId, variableName: variable.name });

  return (
    <div className="container space-y-8 py-8">
       <h1 className="text-2xl font-semibold">Manage Reminders for: {variable.name}</h1>
       <Suspense fallback={<p>Loading reminders...</p>}>
         <RemindersListClient 
            userId={user.id} 
            globalVariableId={globalVariableId} 
            variableName={variable.name} 
            initialSchedules={initialSchedules}
          /> 
       </Suspense>
    </div>
  )
} 
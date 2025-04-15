import { getServerUser } from "@/lib/server-auth"
import { redirect } from "next/navigation"
import { getPatientConditionByIdAction } from "@/app/actions/patient-conditions" // Action to get specific PC
import { getReminderSchedulesForUserVariableAction } from "@/app/actions/reminder-schedules" // Action to get reminders
import { getRatingsForPatientConditionAction } from "@/app/actions/treatment-ratings" // Action to get ratings
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { notFound } from 'next/navigation'
import { Suspense } from "react"
import { createLogger } from "@/lib/logger"
import { Badge } from "@/components/ui/badge"
import { Pencil, Trash2, MessageSquarePlus, Edit, Star } from "lucide-react"

// Import Dialog Components
import { EditConditionDialog } from "./components/edit-condition-dialog"
import { DeleteConditionDialog } from "./components/delete-condition-dialog"
import { RateTreatmentDialog } from "./components/rate-treatment-dialog"
import { LogSeverityDialog } from "./components/log-severity-dialog"
import { ManageRemindersDialog } from "./components/manage-reminders-dialog"
import { EditNotesDialog } from "./components/edit-notes-dialog"

// Import List Components
import { RatingsList } from "./components/ratings-list"
import { RemindersList } from "./components/reminders-list"

// TODO: Import actions/components for treatments, reminders, logging
// import { getTreatmentsForPatientConditionAction } from "@/app/actions/patient-treatments"; // Needs creation
// import { getReminderSchedulesForUserVariableAction } from "@/app/actions/reminder-schedules";
// import { PatientTreatmentsList } from "./components/PatientTreatmentsList"; // Needs creation
// import { ConditionReminders } from "./components/ConditionReminders"; // Needs creation

const logger = createLogger("patient-condition-detail-page")

// Remove the separate interface
// interface PatientConditionDetailPageProps {
//   params: { id: string }; // id here is patient_condition_id
// }

// Destructure params directly in the signature
export default async function PatientConditionDetailPage({ params }: { params: { id: string } }) {
  // Await params before accessing its properties
  const { id: patientConditionId } = await params;
  
  const user = await getServerUser()
  if (!user) {
    redirect("/login")
  }

  // Use the awaited patientConditionId
  logger.info("Loading patient condition detail page", { userId: user.id, patientConditionId });

  // Fetch the specific patient condition record using the awaited ID
  const condition = await getPatientConditionByIdAction(patientConditionId);

  // If condition not found or doesn't belong to user (assuming RLS handles user check), show 404
  if (!condition || condition.patient_id !== user.id) {
     logger.warn("Patient condition not found or access denied", { userId: user.id, patientConditionId });
     notFound();
  }

  // Fetch associated ratings for this patient condition
  const conditionRatings = await getRatingsForPatientConditionAction(patientConditionId);

  // Fetch reminders linked to the global condition ID, passing user ID as well
  const conditionReminders = condition.condition_id 
    ? await getReminderSchedulesForUserVariableAction(user.id, condition.condition_id)
    : [];

  return (
    <div className="container space-y-8 py-8">
      {/* Header Card */}
      <Card>
        <CardHeader>
           <div className="flex justify-between items-start gap-4">
              <div>
                 <CardTitle className="text-2xl">{condition.condition_name || "Condition Details"}</CardTitle>
                 {condition.description && (
                   <CardDescription>{condition.description}</CardDescription>
                 )}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                 {/* Replace Edit Button with Dialog Trigger */}
                 <EditConditionDialog patientCondition={condition} />

                 {/* Replace Delete Button with Dialog Trigger */}
                 <DeleteConditionDialog 
                   patientConditionId={condition.id!} 
                   conditionName={condition.condition_name} 
                 />
              </div>
           </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
           <div className="space-y-1">
             <p className="text-sm font-medium text-muted-foreground">Status</p>
             <div><Badge variant={condition.status === 'active' ? 'default' : 'secondary'} className="capitalize">{condition.status || "N/A"}</Badge></div>
           </div>
           <div className="space-y-1">
             <p className="text-sm font-medium text-muted-foreground">Severity</p>
             <p className="capitalize">{condition.severity || "N/A"}</p>
           </div>
           <div className="space-y-1">
             <p className="text-sm font-medium text-muted-foreground">Diagnosed Date</p>
             <p>{condition.diagnosed_at ? new Date(condition.diagnosed_at).toLocaleDateString() : "N/A"}</p>
           </div>
        </CardContent>
      </Card>

      {/* Condition Ratings Card - Updated */}
      <Card>
         <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Treatment Ratings (for this Condition)</CardTitle>
              <CardDescription>How effective have treatments been specifically for {condition.condition_name || "this condition"}?</CardDescription>
            </div>
             {/* MOVED: Rate Treatment Button */}
            <RateTreatmentDialog patientCondition={condition}>
              <Button variant="outline">
                <Star className="mr-2 h-4 w-4"/> Rate Treatment
              </Button>
            </RateTreatmentDialog>
         </CardHeader>
         <CardContent>
             <Suspense fallback={<p className="text-muted-foreground">Loading ratings...</p>}> 
                <RatingsList ratings={conditionRatings} patientCondition={condition} /> 
             </Suspense>
             <div className="mt-4">
                {/* Replace AddTreatmentDialog with RateTreatmentDialog */}
                <RateTreatmentDialog patientCondition={condition}>
                  <Button variant="outline">
                    <Star className="mr-2 h-4 w-4"/> Rate Treatment for this Condition
                  </Button>
                </RateTreatmentDialog>
             </div>
         </CardContent>
      </Card>

      {/* Condition Tracking & Reminders Card */}
      <Card>
         <CardHeader>
            <CardTitle>Tracking & Reminders</CardTitle>
            <CardDescription>Log severity and manage reminders for this condition.</CardDescription>
         </CardHeader>
         <CardContent>
            <div className="mb-4">
                {/* Replace Button with LogSeverityDialog Trigger */}
                <LogSeverityDialog patientCondition={condition} />
            </div>
            <Suspense fallback={<p className="text-muted-foreground">Loading reminders...</p>}> 
                 {/* Render RemindersList component */}
                 <RemindersList reminders={conditionReminders} conditionName={condition.condition_name} /> 
            </Suspense>
              <div className="mt-4">
                 {/* Replace Link/Button with ManageRemindersDialog Trigger */}
                 <ManageRemindersDialog 
                   userVariableId={condition.condition_id!} // Pass global condition ID
                   conditionName={condition.condition_name}
                 >
                    <Button variant="outline">Manage Reminders</Button>
                 </ManageRemindersDialog>
              </div>
         </CardContent>
      </Card>

       {/* Notes Card */}
       {condition.notes && (
          <Card>
             <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Notes</CardTitle>
                {/* Add Edit Notes Dialog Trigger */}
                <EditNotesDialog patientCondition={condition}>
                  <Button variant="ghost" size="icon">
                    <Edit className="h-4 w-4" />
                  </Button>
                </EditNotesDialog>
             </CardHeader>
             <CardContent>
                <p className="text-sm whitespace-pre-wrap">{condition.notes}</p>
             </CardContent>
          </Card>
        )}

    </div>
  )
}

// Force dynamic rendering for this page as it depends on params
export const dynamic = 'force-dynamic' 
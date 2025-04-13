import { getServerUser } from "@/lib/server-auth"
import { redirect } from "next/navigation"
import { getPatientConditionByIdAction } from "@/app/actions/patient-conditions" // Action to get specific PC
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { notFound } from 'next/navigation'
import { Suspense } from "react"
import { createLogger } from "@/lib/logger"
import { Badge } from "@/components/ui/badge"
import { Pencil, Trash2, MessageSquarePlus } from "lucide-react"

// TODO: Import actions/components for treatments, reminders, logging
// import { getTreatmentsForPatientConditionAction } from "@/app/actions/patient-treatments"; // Needs creation
// import { getReminderSchedulesForUserVariableAction } from "@/app/actions/reminder-schedules";
// import { PatientTreatmentsList } from "./components/PatientTreatmentsList"; // Needs creation
// import { ConditionReminders } from "./components/ConditionReminders"; // Needs creation

const logger = createLogger("patient-condition-detail-page")

interface PatientConditionDetailPageProps {
  params: { id: string }; // id here is patient_condition_id
}

export default async function PatientConditionDetailPage({ params }: PatientConditionDetailPageProps) {
  const user = await getServerUser()
  if (!user) {
    redirect("/login")
  }

  const patientConditionId = params.id;
  logger.info("Loading patient condition detail page", { userId: user.id, patientConditionId });

  // Fetch the specific patient condition record
  const condition = await getPatientConditionByIdAction(patientConditionId);

  // If condition not found or doesn't belong to user (assuming RLS handles user check), show 404
  if (!condition || condition.patient_id !== user.id) {
     logger.warn("Patient condition not found or access denied", { userId: user.id, patientConditionId });
     notFound();
  }

  // TODO: Fetch associated treatments for this specific patient_condition_id
  // const associatedTreatments = await getTreatmentsForPatientConditionAction(patientConditionId);

  // TODO: Fetch reminders linked to the global condition ID
  // const reminders = await getReminderSchedulesForUserVariableAction(condition.condition_id!); // Use global condition_id

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
                 {/* TODO: Link to Edit Page/Dialog */}
                 <Button variant="outline" size="sm">
                    <Pencil className="mr-1 h-4 w-4" /> Edit
                 </Button>
                 {/* TODO: Implement Delete functionality */}
                 <Button variant="destructive" size="sm">
                   <Trash2 className="mr-1 h-4 w-4" /> Delete
                 </Button>
              </div>
           </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
           <div className="space-y-1">
             <p className="text-sm font-medium text-muted-foreground">Status</p>
             <p><Badge variant={condition.status === 'active' ? 'default' : 'secondary'} className="capitalize">{condition.status || "N/A"}</Badge></p>
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

      {/* Associated Treatments Card */}
      <Card>
         <CardHeader>
            <CardTitle>Associated Treatments</CardTitle>
            <CardDescription>Treatments you are using or have used for this condition.</CardDescription>
         </CardHeader>
         <CardContent>
             <Suspense fallback={<p>Loading treatments...</p>}> 
                {/* TODO: Implement and render PatientTreatmentsList component */}
                <p className="text-muted-foreground">Treatment list component needed here.</p>
                {/* <PatientTreatmentsList treatments={associatedTreatments} /> */} 
             </Suspense>
             <div className="mt-4">
               {/* TODO: Link to where patient can add a treatment for this condition */}
               <Link href={`/patient/treatments?conditionId=${condition.id}`}>
                 <Button variant="outline">Add Treatment for this Condition</Button>
               </Link>
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
                {/* TODO: Implement Severity Logging */}
                <Button>
                   <MessageSquarePlus className="mr-2 h-4 w-4" /> Log Severity / Symptom
                </Button>
            </div>
            <Suspense fallback={<p>Loading reminders...</p>}> 
                 {/* TODO: Implement and render ConditionReminders component */}
                 <p className="text-muted-foreground">Reminder list component needed here.</p>
                 {/* <ConditionReminders reminders={reminders} userVariableId={condition.condition_id!} /> */} 
            </Suspense>
              <div className="mt-4">
                {/* TODO: Link to reminder management page/dialog */}
               <Link href={`/patient/reminders?variableId=${condition.condition_id}`}>
                  <Button variant="outline">Manage Reminders</Button>
               </Link>
             </div>
         </CardContent>
      </Card>

       {/* Notes Card */}
       {condition.notes && (
          <Card>
             <CardHeader>
                <CardTitle>Notes</CardTitle>
             </CardHeader>
             <CardContent>
                <p className="text-sm whitespace-pre-wrap">{condition.notes}</p>
             </CardContent>
          </Card>
        )}

    </div>
  )
} 
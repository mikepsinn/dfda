import { getServerUser } from "@/lib/server-auth"
import { redirect } from "next/navigation"
import { TreatmentSearchInput } from "@/components/TreatmentSearchInput" // Renamed component
import { createLogger } from "@/lib/logger"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { StarRating } from "@/components/ui/star-rating"
import { Suspense } from "react"
import { getPatientConditionsAction } from "@/app/actions/patient-conditions"
import type { PatientCondition } from "@/app/actions/patient-conditions"
import { addInitialPatientTreatmentsAction } from "@/app/actions/patient-treatments"
import { createDefaultReminderAction } from "@/app/actions/reminder-schedules"

// Placeholder for action
// import { addInitialPatientTreatmentsAction } from "@/app/actions/patient-treatments" 

const logger = createLogger("patient-onboarding-treatments-page")

interface TreatmentEntry {
  treatmentId: string;
  treatmentName: string;
  dosage: string;
  schedule: string;
  effectiveness: number | null;
}

interface ConditionTreatmentState {
  [conditionId: string]: TreatmentEntry[];
}

function OnboardingTreatmentsClientContent({ userId, conditions }: { userId: string, conditions: PatientCondition[] }) {
  "use client"
  import { useState } from "react"
  import { useRouter } from 'next/navigation' 

  // State to hold treatments added per condition
  const [treatmentsByCondition, setTreatmentsByCondition] = useState<ConditionTreatmentState>({});
  // State for the currently selected treatment from search (before adding details)
  const [currentSelection, setCurrentSelection] = useState<{conditionId: string; treatment: {id: string; name: string} } | null>(null);
  // State for the details being entered for the currentSelection
  const [currentDetails, setCurrentDetails] = useState({ dosage: '', schedule: '', effectiveness: null as number | null });
  
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // When a treatment is selected from the search input
  const handleTreatmentSelect = (conditionId: string, treatment: { id: string; name: string }) => {
     logger.info('Treatment selected for condition', { conditionId, treatmentId: treatment.id });
     setCurrentSelection({ conditionId, treatment });
     setCurrentDetails({ dosage: '', schedule: '', effectiveness: null }); // Reset details
  };

  // When details for the selected treatment are confirmed
  const handleAddTreatmentDetails = () => {
    if (!currentSelection) return;
    const { conditionId, treatment } = currentSelection;

    const newEntry: TreatmentEntry = {
      treatmentId: treatment.id,
      treatmentName: treatment.name,
      dosage: currentDetails.dosage,
      schedule: currentDetails.schedule,
      effectiveness: currentDetails.effectiveness,
    };

    setTreatmentsByCondition(prev => ({
       ...prev,
       [conditionId]: [...(prev[conditionId] || []), newEntry]
    }));

    logger.info('Treatment details added', { conditionId, treatmentId: treatment.id });
    setCurrentSelection(null); // Clear selection to allow searching again
  };

  const handleRemoveTreatment = (conditionId: string, treatmentId: string) => {
     setTreatmentsByCondition(prev => ({
        ...prev,
        [conditionId]: (prev[conditionId] || []).filter(t => t.treatmentId !== treatmentId)
     }));
  };

  const handleNext = async () => {
    setIsLoading(true);
    logger.info("Submitting initial treatments", { userId, data: treatmentsByCondition });
    try {
       // Call the server action to save treatments
       const result = await addInitialPatientTreatmentsAction(userId, treatmentsByCondition);
       
       if (!result.success) {
         throw new Error(result.error || "Server action failed");
       }
       logger.info('Initial treatments saved', { userId });

       // Attempt to create default reminders for treatments added (fire-and-forget)
       logger.info("Attempting to create default treatment reminders", { userId });
       for (const conditionId in treatmentsByCondition) {
          for (const treatment of treatmentsByCondition[conditionId]) {
             createDefaultReminderAction(userId, treatment.treatmentId, treatment.treatmentName, 'treatment')
                .then(reminderResult => {
                    if (!reminderResult.success) {
                       logger.warn('Failed to create default reminder for treatment', { userId, treatmentId: treatment.treatmentId, error: reminderResult.error });
                    }
                 })
                 .catch(err => { 
                    logger.error('Error calling createDefaultReminderAction for treatment', { userId, treatmentId: treatment.treatmentId, err });
                 });
          }
       }

       logger.info('Navigating to dashboard after treatment submission and reminder attempts', { userId });
       // Navigate to dashboard after saving
       alert("Treatments saved! Onboarding complete."); // Replace with toast
       router.push('/patient');
    } catch (error) {
      logger.error("Failed to save treatments", { userId, error });
      alert("Failed to save treatments. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {conditions.map(condition => (
        <Card key={condition.id}>
          <CardHeader>
            <CardTitle>Treatments for: {condition.condition_name}</CardTitle>
            <CardDescription>Add the treatments you are using for this condition and rate their effectiveness.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Display Treatments Added So Far for this Condition */}
            {(treatmentsByCondition[condition.id!] || []).length > 0 && (
              <div className="space-y-2 rounded-md border p-4">
                 <h4 className="font-medium text-sm">Added Treatments:</h4>
                 <ul className="list-disc space-y-1 pl-5 text-sm">
                    {(treatmentsByCondition[condition.id!] || []).map(t => (
                      <li key={t.treatmentId} className="flex items-center justify-between">
                         <span>
                            {t.treatmentName} 
                            <span className="text-muted-foreground text-xs ml-2">({t.dosage || '-'} / {t.schedule || '-'})</span>
                            {t.effectiveness !== null && <span className="text-muted-foreground text-xs ml-2">Rating: {t.effectiveness}/10</span>}
                         </span>
                         <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveTreatment(condition.id!, t.treatmentId)}>&times;</Button>
                      </li>
                    ))}
                 </ul>
              </div>
            )}

            {/* Area to Add New Treatment */}
            {!currentSelection || currentSelection.conditionId !== condition.id ? (
                // Show search if no treatment is selected for this condition
                <div>
                  <Label className="mb-1 block text-sm">Search and select treatment:</Label>
                  <TreatmentSearchInput 
                    onSelect={(treatment) => handleTreatmentSelect(condition.id!, treatment)} 
                    selected={null} 
                   />
                </div>
            ) : (
               // Show details form if a treatment IS selected for this condition
               <div className="space-y-4 rounded-md border bg-muted/50 p-4">
                  <h4 className="font-medium">Enter details for: {currentSelection.treatment.name}</h4>
                  <div className="grid gap-2">
                     <Label htmlFor={`dosage-${condition.id}`}>Dosage (e.g., 50mg, 1 tablet)</Label>
                     <Input 
                       id={`dosage-${condition.id}`}
                       value={currentDetails.dosage}
                       onChange={e => setCurrentDetails(prev => ({...prev, dosage: e.target.value}))} 
                      />
                  </div>
                   <div className="grid gap-2">
                     <Label htmlFor={`schedule-${condition.id}`}>Schedule (e.g., daily, twice daily)</Label>
                     <Input 
                       id={`schedule-${condition.id}`}
                       value={currentDetails.schedule}
                       onChange={e => setCurrentDetails(prev => ({...prev, schedule: e.target.value}))} 
                      />
                  </div>
                   <div className="grid gap-2">
                     <Label>Initial Effectiveness (0-10)</Label>
                     <StarRating 
                       rating={currentDetails.effectiveness}
                       onRatingChange={rating => setCurrentDetails(prev => ({...prev, effectiveness: rating}))} 
                       size="md"
                      />
                  </div>
                  <div className="flex justify-end gap-2">
                     <Button variant="ghost" onClick={() => setCurrentSelection(null)}>Cancel</Button>
                     <Button onClick={handleAddTreatmentDetails}>Add Treatment Details</Button>
                  </div>
               </div>
            )}
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-end pt-4">
         <Button onClick={handleNext} disabled={isLoading}>
             {isLoading ? "Saving..." : "Finish Onboarding"}
          </Button>
      </div>
    </div>
  )
}

export default async function PatientOnboardingTreatmentsPage() {
  const user = await getServerUser()
  if (!user) {
    redirect("/login")
  }

  // Fetch the conditions added in the previous step
  const conditions = await getPatientConditionsAction(user.id)

  if (!conditions || conditions.length === 0) {
     logger.warn("User reached treatment onboarding without conditions, redirecting", { userId: user.id });
     redirect('/patient/onboarding'); // Go back if no conditions exist
  }

  logger.info("Rendering treatment onboarding page", { userId: user.id, conditionCount: conditions.length });

  return (
    <div className="container mx-auto max-w-2xl py-12">
       <h2 className="text-2xl font-semibold mb-6">Add Your Treatments</h2>
      <Suspense fallback={<p>Loading treatments step...</p>}>
         <OnboardingTreatmentsClientContent userId={user.id} conditions={conditions} />
      </Suspense>
    </div>
  )
} 
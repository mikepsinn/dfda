"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Brain, Check, ChevronRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { logger } from '@/lib/logger'

// Import Actions and Types
import {
    getPatientDetailsForAssignment, 
    getInterventionOptionsForTrial, 
    assignIntervention,
    PatientAssignmentDetails, 
    InterventionOption
} from '@/app/actions/intervention-assignment-actions'

interface InterventionAssignmentFormProps {
  patientId: string;
}

export function InterventionAssignmentForm({ patientId }: InterventionAssignmentFormProps) {
  // State for fetched data
  const [patientDetails, setPatientDetails] = useState<PatientAssignmentDetails | null>(null);
  const [interventionOptions, setInterventionOptions] = useState<InterventionOption[]>([]);
  const [isLoadingPatient, setIsLoadingPatient] = useState(true);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for form interaction
  const [selectedInterventionId, setSelectedInterventionId] = useState<string | null>(null);
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { toast } = useToast();

  // --- Data Fetching Effects ---

  // Fetch patient details
  useEffect(() => {
    setIsLoadingPatient(true);
    setError(null);
    getPatientDetailsForAssignment(patientId)
      .then(data => {
        if (data) {
          setPatientDetails(data);
        } else {
          setError("Patient details not found or access denied.");
          logger.warn('Patient details fetch returned null', { patientId });
        }
      })
      .catch(err => {
        setError("Failed to load patient details.");
        logger.error('Error fetching patient details', { patientId, error: err });
      })
      .finally(() => setIsLoadingPatient(false));
  }, [patientId]);

  // Fetch intervention options once patient details (and trial ID) are available
  useEffect(() => {
    // Find the active trial enrollment (adjust logic if multiple are possible)
    const activeEnrollment = patientDetails?.trial_enrollments?.[0]; // Simplistic: assumes first is relevant
    const trialId = activeEnrollment?.trial_id;

    if (trialId) {
      setIsLoadingOptions(true);
      getInterventionOptionsForTrial(trialId)
        .then(options => {
          setInterventionOptions(options);
        })
        .catch(err => {
          // Don't necessarily set main error, maybe just log?
          logger.error('Error fetching intervention options', { trialId, error: err });
          // Optionally show a specific error for options loading?
        })
        .finally(() => setIsLoadingOptions(false));
    } else if (patientDetails) {
        // Patient details loaded, but no active trial found
        logger.warn('No active trial enrollment found for patient to fetch intervention options', { patientId });
        // Optionally set an error state?
    }
  }, [patientDetails, patientId]); // Re-run if patientDetails change


  // --- Submission Handler ---
  const handleSubmit = async () => {
    const activeEnrollment = patientDetails?.trial_enrollments?.[0];
    if (!selectedInterventionId || !activeEnrollment?.id) {
        toast({ title: "Error", description: "Please select an intervention and ensure patient enrollment is valid.", variant: "destructive" });
        return;
    } 
    
    setIsSubmitting(true);
    logger.info("Submitting intervention assignment", { 
        enrollmentId: activeEnrollment.id, 
        interventionId: selectedInterventionId, 
        patientId 
    });

    const result = await assignIntervention({
        enrollmentId: activeEnrollment.id,
        assignedInterventionId: selectedInterventionId,
        notes: clinicalNotes || null,
    });

    setIsSubmitting(false);

    if (result.success) {
      setIsSuccess(true);
      // toast is shown in the success view now
      // toast({ title: "Success", description: "Intervention assigned successfully." });
    } else {
      toast({ title: "Assignment Failed", description: result.error || "An unknown error occurred.", variant: "destructive" });
      logger.error('Intervention assignment failed', { patientId, enrollmentId: activeEnrollment.id, selectedInterventionId, error: result.error });
    }
  }

  // --- Loading and Error States ---
  if (isLoadingPatient) {
    return (
      <Card>
        <CardHeader><CardTitle>Loading Patient Data...</CardTitle></CardHeader>
        <CardContent className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader><CardTitle>Error</CardTitle></CardHeader>
        <CardContent>
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!patientDetails) {
    return <Card><CardContent><p>Patient data could not be loaded.</p></CardContent></Card>;
  }

  // Find the active trial enrollment and trial details
  const activeEnrollment = patientDetails.trial_enrollments?.[0];
  const trial = activeEnrollment?.trials;
  const patientProfile = patientDetails.profiles;

  // Helper to generate avatar fallback
  const getAvatarFallback = (firstName?: string | null, lastName?: string | null): string => {
      const firstInitial = firstName?.[0] || 'P';
      const lastInitial = lastName?.[0] || '';
      return `${firstInitial}${lastInitial}`.toUpperCase();
  }

  // --- Render Logic ---

  return (
    <>
      {isSuccess ? (
        // Success View (uses state derived *before* success)
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="rounded-full bg-green-100 p-3">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="mt-4 text-2xl font-bold">Intervention Successfully Assigned</h2>
              <p className="mt-2 text-muted-foreground">
                You have successfully assigned {
                    interventionOptions.find(opt => opt.id === selectedInterventionId)?.name || 'the selected intervention'
                } to {patientProfile?.first_name || 'the patient'} {patientProfile?.last_name || ''}.
              </p>
              <div className="mt-6 flex gap-4">
                <Link href="/provider/">
                  <Button variant="outline">Return to Dashboard</Button>
                </Link>
                <Link href={`/provider/patients/${patientId}`}>
                  <Button>View Patient</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        // Assignment Form View
        <div className="grid gap-6 md:grid-cols-3">
          {/* Patient Info Column */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Patient Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Patient Avatar and Basic Info */}
                <div className="flex items-center gap-3">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-lg">
                      {getAvatarFallback(patientProfile?.first_name, patientProfile?.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">{patientProfile?.first_name} {patientProfile?.last_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {/* {patientDetails.age} years • {patientDetails.gender} TODO: Add age/gender if available */} 
                      {patientProfile?.email}
                    </p>
                    {/* TODO: Display primary condition from patient_conditions */} 
                    {/* <Badge className="mt-1">{patientDetails.condition}</Badge> */} 
                  </div>
                </div>
                <Separator />
                {/* Trial Enrollment */}
                {trial && activeEnrollment && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Trial Enrollment</h3>
                    <div className="rounded-lg bg-muted p-3">
                      <div className="flex items-center gap-2">
                        <Brain className="h-4 w-4 text-primary" />
                        <span className="font-medium">{trial.title}</span>
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                          Enrolled on {activeEnrollment.enrollment_date ? new Date(activeEnrollment.enrollment_date).toLocaleDateString() : 'N/A'}
                      </div>
                      <Badge variant="secondary" className="mt-1">Status: {activeEnrollment.status}</Badge>
                    </div>
                  </div>
                )}
                {/* Medical History - Placeholder */} 
                {/* TODO: Fetch and display actual conditions from patient_conditions */} 
                <div>
                  <h3 className="text-sm font-medium mb-2">Conditions</h3>
                   {patientDetails.patient_conditions.length > 0 ? (
                     <div className="space-y-2">
                        {patientDetails.patient_conditions.map((item) => (
                           <div key={item.id} className="rounded-lg border p-2">
                              {/* Need condition name here */} 
                              <div className="font-medium">Condition ID: {item.conditions?.id}</div> 
                              {item.diagnosed_at && <div className="text-xs text-muted-foreground">Since {new Date(item.diagnosed_at).toLocaleDateString()}</div>}
                              {item.status && <div className="text-xs text-muted-foreground">Status: {item.status}</div>}
                              {item.notes && <div className="mt-1 text-xs">Notes: {item.notes}</div>}
                           </div>
                        ))}
                     </div>
                   ) : (
                      <p className="text-sm text-muted-foreground">No conditions recorded.</p>
                   )}
                </div>
                {/* Recent Assessments - Placeholder */} 
                <div>
                  <h3 className="text-sm font-medium mb-2">Recent Assessments</h3>
                  <p className="text-sm text-muted-foreground">Assessment data not yet implemented.</p>
                   {/* TODO: Fetch and display recent assessments, likely from measurements table */} 
                </div>
                 {/* Biomarkers - Placeholder */} 
                <div>
                  <h3 className="text-sm font-medium mb-2">Biomarkers</h3>
                  <p className="text-sm text-muted-foreground">Biomarker data not yet implemented.</p>
                   {/* TODO: Fetch and display biomarkers, likely from measurements table */} 
                </div>
                {/* Allergies - Placeholder */} 
                <div>
                  <h3 className="text-sm font-medium mb-2">Allergies</h3>
                   <p className="text-sm text-muted-foreground">{patientDetails.allergies?.join(", ") || "None reported"}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Intervention Assignment Column */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Assign Intervention Arm</CardTitle>
                <CardDescription>
                  Select the intervention arm for {trial?.title || 'this trial'} based on the protocol and patient factors.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingOptions ? (
                  <div className="flex justify-center items-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2">Loading intervention options...</span>
                  </div>
                ) : interventionOptions.length > 0 ? (
                    <RadioGroup
                        value={selectedInterventionId ?? undefined} // Control component value
                        onValueChange={setSelectedInterventionId}
                    >
                    <div className="space-y-4">
                        {interventionOptions.map((option) => (
                        <div key={option.id} className="flex items-start space-x-3 rounded-lg border p-4 transition-colors hover:bg-muted/50 data-[state=checked]:border-primary">
                            <RadioGroupItem value={option.id} id={`intervention-${option.id}`} className="mt-1" />
                            <div className="flex-1 grid gap-1.5">
                            <Label htmlFor={`intervention-${option.id}`} className="font-semibold cursor-pointer">
                                {option.name} 
                                {option.treatment_type && <Badge variant="outline" className="ml-2">{option.treatment_type}</Badge>}
                            </Label>
                            <p className="text-sm text-muted-foreground">{option.description}</p>
                            {/* Tabs for Details - Using placeholder data from action */} 
                            <Tabs defaultValue="details" className="mt-3 text-xs">
                                <TabsList className="grid w-full grid-cols-3 h-8">
                                <TabsTrigger value="details" className="text-xs px-2">Details</TabsTrigger>
                                <TabsTrigger value="monitoring" className="text-xs px-2">Monitoring</TabsTrigger>
                                <TabsTrigger value="safety" className="text-xs px-2">Safety</TabsTrigger>
                                </TabsList>
                                <TabsContent value="details" className="mt-2 p-2 bg-muted/30 rounded">
                                <p>{option.details}</p>
                                <p><span className="font-medium">Route:</span> {option.route}</p>
                                <p><span className="font-medium">Frequency:</span> {option.frequency}</p>
                                <p><span className="font-medium">Duration:</span> {option.duration}</p>
                                </TabsContent>
                                <TabsContent value="monitoring" className="mt-2 p-2 bg-muted/30 rounded">
                                <p>{option.monitoring}</p>
                                </TabsContent>
                                <TabsContent value="safety" className="mt-2 p-2 bg-muted/30 rounded">
                                <p className="font-medium mb-1">Potential Side Effects:</p>
                                <ul className="list-disc pl-4 mb-2">
                                    {option.sideEffects.map((se, i) => <li key={i}>{se.name} ({se.frequency})</li>)} 
                                    {option.sideEffects.length === 0 && <li>Data not available</li>}
                                </ul>
                                <p className="font-medium mb-1">Contraindications:</p>
                                <ul className="list-disc pl-4">
                                    {option.contraindications.map((ci, i) => <li key={i}>{ci}</li>)}
                                    {option.contraindications.length === 0 && <li>Data not available</li>}
                                </ul>
                                </TabsContent>
                            </Tabs>
                            </div>
                        </div>
                        ))}
                    </div>
                    </RadioGroup>
                ) : (
                    <p className="text-center text-muted-foreground py-6">No intervention options available for this trial or failed to load.</p>
                )}

                <Separator className="my-6" />

                <div>
                  <Label htmlFor="clinical-notes">Clinical Rationale / Notes (Optional)</Label>
                  <Textarea
                    id="clinical-notes"
                    placeholder="Enter any relevant notes regarding this intervention assignment..."
                    value={clinicalNotes}
                    onChange={(e) => setClinicalNotes(e.target.value)}
                    className="mt-2"
                    rows={4}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button
                  onClick={handleSubmit}
                  disabled={!selectedInterventionId || isSubmitting || isLoadingOptions}
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSubmitting ? "Assigning..." : "Assign Intervention & Proceed"}
                  {!isSubmitting && <ChevronRight className="ml-2 h-4 w-4" />} 
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
    </>
  )
} 
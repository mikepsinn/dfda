"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Check, ChevronRight, FileText, Info } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

export default function PatientEnrollment({ params }: { params: { id: string } }) {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedTrial, setSelectedTrial] = useState<number | null>(null)
  const [enrollmentComplete, setEnrollmentComplete] = useState(false)

  // Mock patient data
  const patientData = {
    id: Number.parseInt(params.id),
    name: "James Wilson",
    age: 58,
    gender: "Male",
    condition: "Type 2 Diabetes",
    medications: ["Metformin 1000mg BID", "Lisinopril 10mg QD"],
    lastHbA1c: 8.2,
    lastVisit: "Feb 28, 2025",
  }

  // Mock eligible trials
  const eligibleTrials = [
    {
      id: 1,
      name: "Comparative Effectiveness of Treatments A and B for Type 2 Diabetes",
      research_partner: "Innovative Therapeutics Inc.",
      phase: "Phase 3",
      duration: "6 months",
      visits: 4,
      compensation: "$400 per patient",
      match: "High",
      description:
        "This pragmatic trial compares the effectiveness of two established treatments for type 2 diabetes in a real-world setting. Patients will be randomized to receive either Treatment A or Treatment B as part of their standard care.",
      interventions: [
        {
          name: "Treatment A",
          description: "Once-daily oral medication",
          frequency: "Daily",
        },
        {
          name: "Treatment B",
          description: "Twice-daily oral medication",
          frequency: "Twice daily",
        },
      ],
      eligibilityCriteria: [
        "Type 2 diabetes diagnosis for at least 6 months",
        "HbA1c between 7.5% and 10.0%",
        "Age 18-75 years",
        "Not currently on insulin therapy",
      ],
    },
    {
      id: 2,
      name: "Novel Combination Therapy for Uncontrolled Type 2 Diabetes",
      research_partner: "Diabetes Research Foundation",
      phase: "Phase 2",
      duration: "12 months",
      visits: 6,
      compensation: "$600 per patient",
      match: "Medium",
      description:
        "This trial evaluates a novel combination therapy approach for patients with type 2 diabetes who have not achieved glycemic control on standard therapy.",
      interventions: [
        {
          name: "Combination Therapy",
          description: "Standard therapy plus investigational agent",
          frequency: "Daily",
        },
        {
          name: "Standard Therapy",
          description: "Current standard of care",
          frequency: "As prescribed",
        },
      ],
      eligibilityCriteria: [
        "Type 2 diabetes with HbA1c > 8.0% despite standard therapy",
        "Age 21-70 years",
        "No history of cardiovascular disease",
        "eGFR > 60 mL/min/1.73m²",
      ],
    },
  ]

  const handleTrialSelect = (trialId: number) => {
    setSelectedTrial(trialId)
  }

  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    } else {
      setEnrollmentComplete(true)
    }
  }

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const selectedTrialData = eligibleTrials.find((trial) => trial.id === selectedTrial)

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 py-6 md:py-10">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <div className="mb-8 flex items-center gap-2">
              <Link href="/app/(protected)/provider/dashboard" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back to dashboard</span>
              </Link>
              <h1 className="text-2xl font-bold">Enroll Patient in Trial</h1>
            </div>

            {!enrollmentComplete ? (
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <CardTitle>Enrolling: {patientData.name}</CardTitle>
                      <CardDescription>
                        {patientData.age} years • {patientData.gender} • {patientData.condition}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Step {currentStep} of 3</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {currentStep === 1 && (
                      <div className="space-y-6">
                        <h3 className="text-lg font-medium">Select a Trial</h3>
                        <p className="text-sm text-muted-foreground">
                          The following trials match this patient's profile. Select one to continue.
                        </p>

                        <div className="space-y-4">
                          {eligibleTrials.map((trial) => (
                            <div
                              key={trial.id}
                              className={`rounded-lg border p-4 cursor-pointer transition-colors ${
                                selectedTrial === trial.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                              }`}
                              onClick={() => handleTrialSelect(trial.id)}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                <div>
                                  <div className="font-medium">{trial.name}</div>
                                  <div className="text-sm text-muted-foreground">{trial.research_partner}</div>
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    <Badge variant="outline" className="text-xs">
                                      {trial.phase}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {trial.duration}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {trial.visits} visits
                                    </Badge>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end">
                                  <Badge
                                    className={`
                                      ${trial.match === "High" ? "bg-green-100 text-green-800" : ""}
                                      ${trial.match === "Medium" ? "bg-yellow-100 text-yellow-800" : ""}
                                      ${trial.match === "Low" ? "bg-red-100 text-red-800" : ""}
                                    `}
                                  >
                                    {trial.match} Match
                                  </Badge>
                                  <div className="mt-2 text-sm font-medium">{trial.compensation}</div>
                                </div>
                              </div>

                              <Separator className="my-4" />

                              <p className="text-sm">{trial.description}</p>

                              <div className="mt-4 flex justify-end">
                                <RadioGroup value={selectedTrial?.toString()}>
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem
                                      value={trial.id.toString()}
                                      id={`trial-${trial.id}`}
                                      checked={selectedTrial === trial.id}
                                    />
                                    <Label htmlFor={`trial-${trial.id}`}>Select this trial</Label>
                                  </div>
                                </RadioGroup>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {currentStep === 2 && selectedTrialData && (
                      <div className="space-y-6">
                        <h3 className="text-lg font-medium">Trial Details & Intervention Assignment</h3>

                        <div className="rounded-lg border p-4">
                          <h4 className="font-medium">{selectedTrialData.name}</h4>
                          <p className="text-sm text-muted-foreground">{selectedTrialData.research_partner}</p>

                          <Tabs defaultValue="interventions" className="mt-4">
                            <TabsList>
                              <TabsTrigger value="interventions">Interventions</TabsTrigger>
                              <TabsTrigger value="eligibility">Eligibility</TabsTrigger>
                              <TabsTrigger value="schedule">Schedule</TabsTrigger>
                            </TabsList>

                            <TabsContent value="interventions" className="space-y-4 mt-4">
                              <p className="text-sm">
                                This trial compares the following interventions. Please select which intervention arm
                                you would like to assign to this patient.
                              </p>

                              <RadioGroup defaultValue="treatment-a">
                                {selectedTrialData.interventions.map((intervention, index) => (
                                  <div key={index} className="flex items-start space-x-2 rounded-lg border p-3 mb-3">
                                    <RadioGroupItem
                                      value={`treatment-${String.fromCharCode(97 + index)}`}
                                      id={`treatment-${String.fromCharCode(97 + index)}`}
                                      className="mt-1"
                                    />
                                    <div className="grid gap-1.5">
                                      <Label
                                        htmlFor={`treatment-${String.fromCharCode(97 + index)}`}
                                        className="font-medium"
                                      >
                                        {intervention.name}
                                      </Label>
                                      <p className="text-sm text-muted-foreground">
                                        {intervention.description} • {intervention.frequency}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </RadioGroup>

                              <div className="rounded-lg bg-muted p-4 flex items-start gap-3">
                                <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                                <div>
                                  <h5 className="font-medium">Clinical Judgment</h5>
                                  <p className="text-sm text-muted-foreground">
                                    This is a pragmatic trial. You may use your clinical judgment to select the most
                                    appropriate intervention for this patient based on their specific needs.
                                  </p>
                                </div>
                              </div>
                            </TabsContent>

                            <TabsContent value="eligibility" className="space-y-4 mt-4">
                              <p className="text-sm">Please confirm that the patient meets all eligibility criteria:</p>

                              <div className="space-y-3">
                                {selectedTrialData.eligibilityCriteria.map((criteria, index) => (
                                  <div key={index} className="flex items-start space-x-2">
                                    <Checkbox id={`criteria-${index}`} defaultChecked />
                                    <div className="grid gap-1.5 leading-none">
                                      <Label htmlFor={`criteria-${index}`} className="text-sm">
                                        {criteria}
                                      </Label>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              <div className="rounded-lg bg-muted p-4">
                                <h5 className="font-medium">Patient Information</h5>
                                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Last HbA1c:</span> {patientData.lastHbA1c}%
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Age:</span> {patientData.age} years
                                  </div>
                                  <div className="col-span-2">
                                    <span className="text-muted-foreground">Current Medications:</span>
                                    <ul className="list-disc list-inside ml-2">
                                      {patientData.medications.map((med, index) => (
                                        <li key={index}>{med}</li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            </TabsContent>

                            <TabsContent value="schedule" className="space-y-4 mt-4">
                              <p className="text-sm">This trial requires the following visit schedule:</p>

                              <div className="space-y-3">
                                <div className="rounded-lg border p-3">
                                  <div className="font-medium">Baseline Visit (Today)</div>
                                  <p className="text-sm text-muted-foreground">
                                    Initial assessment, consent, and intervention assignment
                                  </p>
                                </div>

                                <div className="rounded-lg border p-3">
                                  <div className="font-medium">4-Week Follow-up</div>
                                  <p className="text-sm text-muted-foreground">
                                    Blood work, medication adherence, symptom assessment
                                  </p>
                                </div>

                                <div className="rounded-lg border p-3">
                                  <div className="font-medium">12-Week Follow-up</div>
                                  <p className="text-sm text-muted-foreground">
                                    Comprehensive assessment, HbA1c, medication adjustment if needed
                                  </p>
                                </div>

                                <div className="rounded-lg border p-3">
                                  <div className="font-medium">24-Week Final Visit</div>
                                  <p className="text-sm text-muted-foreground">
                                    Final assessment, outcome measurements, trial completion
                                  </p>
                                </div>
                              </div>
                            </TabsContent>
                          </Tabs>
                        </div>
                      </div>
                    )}

                    {currentStep === 3 && selectedTrialData && (
                      <div className="space-y-6">
                        <h3 className="text-lg font-medium">Patient Consent & EHR Data Sharing</h3>

                        <div className="rounded-lg border p-4">
                          <h4 className="font-medium">Electronic Health Record (EHR) Data Sharing</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            This trial requires access to specific EHR data elements. Please confirm which data the
                            patient consents to share:
                          </p>

                          <div className="mt-4 space-y-3">
                            <div className="flex items-start space-x-2">
                              <Checkbox id="ehr-labs" defaultChecked />
                              <div className="grid gap-1.5 leading-none">
                                <Label htmlFor="ehr-labs" className="text-sm font-medium">
                                  Laboratory Results
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                  HbA1c, fasting glucose, lipid panel, liver function, kidney function
                                </p>
                              </div>
                            </div>

                            <div className="flex items-start space-x-2">
                              <Checkbox id="ehr-meds" defaultChecked />
                              <div className="grid gap-1.5 leading-none">
                                <Label htmlFor="ehr-meds" className="text-sm font-medium">
                                  Medication History
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                  Current and past medications, dosages, and prescription fill history
                                </p>
                              </div>
                            </div>

                            <div className="flex items-start space-x-2">
                              <Checkbox id="ehr-vitals" defaultChecked />
                              <div className="grid gap-1.5 leading-none">
                                <Label htmlFor="ehr-vitals" className="text-sm font-medium">
                                  Vital Signs
                                </Label>
                                <p className="text-xs text-muted-foreground">Blood pressure, heart rate, weight, BMI</p>
                              </div>
                            </div>

                            <div className="flex items-start space-x-2">
                              <Checkbox id="ehr-diagnoses" defaultChecked />
                              <div className="grid gap-1.5 leading-none">
                                <Label htmlFor="ehr-diagnoses" className="text-sm font-medium">
                                  Diagnoses & Conditions
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                  Current and past medical diagnoses and conditions
                                </p>
                              </div>
                            </div>

                            <div className="flex items-start space-x-2">
                              <Checkbox id="ehr-procedures" defaultChecked />
                              <div className="grid gap-1.5 leading-none">
                                <Label htmlFor="ehr-procedures" className="text-sm font-medium">
                                  Procedures & Visits
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                  Healthcare encounters, procedures, and hospitalizations
                                </p>
                              </div>
                            </div>
                          </div>

                          <Separator className="my-4" />

                          <h4 className="font-medium">Consent Documentation</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            Please confirm that you have reviewed the following with the patient:
                          </p>

                          <div className="mt-4 space-y-3">
                            <div className="flex items-start space-x-2">
                              <Checkbox id="consent-trial" />
                              <div className="grid gap-1.5 leading-none">
                                <Label htmlFor="consent-trial" className="text-sm">
                                  I have reviewed the trial information with the patient and they have provided informed
                                  consent to participate.
                                </Label>
                              </div>
                            </div>

                            <div className="flex items-start space-x-2">
                              <Checkbox id="consent-data" />
                              <div className="grid gap-1.5 leading-none">
                                <Label htmlFor="consent-data" className="text-sm">
                                  I have explained the data sharing requirements and the patient has consented to share
                                  the selected EHR data.
                                </Label>
                              </div>
                            </div>

                            <div className="flex items-start space-x-2">
                              <Checkbox id="consent-risks" />
                              <div className="grid gap-1.5 leading-none">
                                <Label htmlFor="consent-risks" className="text-sm">
                                  I have discussed the potential risks and benefits of participation with the patient.
                                </Label>
                              </div>
                            </div>

                            <div className="flex items-start space-x-2">
                              <Checkbox id="consent-withdraw" />
                              <div className="grid gap-1.5 leading-none">
                                <Label htmlFor="consent-withdraw" className="text-sm">
                                  I have informed the patient that they can withdraw from the trial at any time without
                                  affecting their care.
                                </Label>
                              </div>
                            </div>
                          </div>

                          <div className="mt-6 rounded-lg bg-muted p-4 flex items-start gap-3">
                            <FileText className="h-5 w-5 text-blue-500 mt-0.5" />
                            <div>
                              <h5 className="font-medium">Electronic Consent</h5>
                              <p className="text-sm text-muted-foreground">
                                An electronic consent form will be sent to the patient's email for their signature. You
                                will be notified once they have completed this step.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={handlePreviousStep} disabled={currentStep === 1}>
                    Back
                  </Button>
                  <Button onClick={handleNextStep} disabled={currentStep === 1 && selectedTrial === null}>
                    {currentStep < 3 ? "Continue" : "Complete Enrollment"}
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Enrollment Complete</CardTitle>
                  <CardDescription>Patient has been successfully enrolled in the trial</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <div className="rounded-full bg-green-100 p-3 mb-4">
                    <Check className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Enrollment Successful</h3>
                  <p className="text-center text-muted-foreground mb-6 max-w-md">
                    {patientData.name} has been successfully enrolled in the {selectedTrialData?.name} trial. The
                    patient will receive an email with further instructions and consent forms.
                  </p>

                  <div className="w-full max-w-md rounded-lg border p-4 mb-6">
                    <h4 className="font-medium">Next Steps</h4>
                    <ul className="mt-2 space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-600 mt-0.5" />
                        <span>Patient will receive electronic consent forms via email</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-600 mt-0.5" />
                        <span>Schedule baseline assessment and initiate selected intervention</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-600 mt-0.5" />
                        <span>Review trial protocol and documentation in the Decentralized FDA</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-600 mt-0.5" />
                        <span>You'll receive a notification when the patient completes consent</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-center gap-4">
                  <Link href="/app/(protected)/provider/dashboard">
                    <Button>Return to Dashboard</Button>
                  </Link>
                  <Link href={`/app/(protected)/provider/patients/${patientData.id}`}>
                    <Button variant="outline">
                      View Patient Details
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}


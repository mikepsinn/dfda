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

interface PatientEnrollmentWizardProps {
  patientId: string // Accept patientId as a prop
}

export function PatientEnrollmentWizard({ patientId }: PatientEnrollmentWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedTrial, setSelectedTrial] = useState<number | null>(null)
  const [enrollmentComplete, setEnrollmentComplete] = useState(false)

  // Mock patient data (fetch this based on patientId in a real app)
  const patientData = {
    id: Number.parseInt(patientId),
    name: "James Wilson",
    age: 58,
    gender: "Male",
    condition: "Type 2 Diabetes",
    medications: ["Metformin 1000mg BID", "Lisinopril 10mg QD"],
    lastHbA1c: 8.2,
    lastVisit: "Feb 28, 2025",
  }

  // Mock eligible trials (fetch this based on patientId/condition in a real app)
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
      // Here you would typically submit the enrollment data
      console.log("Submitting enrollment for patient:", patientId, "trial:", selectedTrial);
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
    <>
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
                        {/* Trial Selection Card Content */}
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                          <div>
                            <div className="font-medium">{trial.name}</div>
                            <div className="text-sm text-muted-foreground">{trial.research_partner}</div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <Badge variant="outline" className="text-xs">{trial.phase}</Badge>
                              <Badge variant="outline" className="text-xs">{trial.duration}</Badge>
                              <Badge variant="outline" className="text-xs">{trial.visits} visits</Badge>
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
                          {selectedTrialData.interventions.map((intervention: any, index: number) => (
                            <div key={index} className="flex items-start space-x-2 rounded-lg border p-3 mb-3">
                              <RadioGroupItem
                                value={`treatment-${String.fromCharCode(97 + index)}`}
                                id={`treatment-${String.fromCharCode(97 + index)}`}
                                className="mt-1"
                              />
                              <div className="grid gap-1.5">
                                <Label htmlFor={`treatment-${String.fromCharCode(97 + index)}`} className="font-medium">
                                  {intervention.name}
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                  {intervention.description} ({intervention.frequency})
                                </p>
                              </div>
                            </div>
                          ))}
                        </RadioGroup>
                      </TabsContent>
                      <TabsContent value="eligibility" className="mt-4">
                        <h4 className="font-medium mb-2">Eligibility Criteria</h4>
                        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                          {selectedTrialData.eligibilityCriteria.map((criterion: string, index: number) => (
                            <li key={index}>{criterion}</li>
                          ))}
                        </ul>
                      </TabsContent>
                      <TabsContent value="schedule" className="mt-4">
                        <h4 className="font-medium mb-2">Visit Schedule</h4>
                        <p className="text-sm text-muted-foreground">
                          Total duration: {selectedTrialData.duration}, Total visits: {selectedTrialData.visits}
                        </p>
                        {/* Add more detailed schedule if available */}
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              )}

              {currentStep === 3 && selectedTrialData && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium">Consent & Review</h3>
                  <Card>
                    <CardHeader>
                      <CardTitle>Informed Consent</CardTitle>
                      <CardDescription>Review the consent document with the patient.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-48 overflow-y-auto rounded-md border p-4 text-sm bg-muted/30">
                        <h4 className="font-semibold mb-2">Consent Form Summary</h4>
                        <p className="mb-2">
                          This document outlines the purpose, procedures, risks, benefits, and alternatives
                          of participating in the clinical trial titled "{selectedTrialData.name}".
                        </p>
                        <p className="mb-2">
                          Key points include: randomization, potential side effects, confidentiality of data,
                          compensation provided ({selectedTrialData.compensation}), and the right to withdraw at any time.
                        </p>
                        <p>Please read the full document carefully and ask any questions.</p>
                        {/* In a real app, display the full consent form */}
                      </div>
                      <div className="mt-4 flex items-center space-x-2">
                        <Checkbox id="consent-obtained" />
                        <label
                          htmlFor="consent-obtained"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Patient has provided informed consent.
                        </label>
                      </div>
                      <Button variant="outline" size="sm" className="mt-4">
                        <FileText className="mr-2 h-4 w-4" /> View Full Consent Document
                      </Button>
                    </CardContent>
                  </Card>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="font-medium">Enrollment Summary</h4>
                    <p className="text-sm"><span className="font-semibold">Patient:</span> {patientData.name}</p>
                    <p className="text-sm"><span className="font-semibold">Trial:</span> {selectedTrialData.name}</p>
                    <p className="text-sm"><span className="font-semibold">Assigned Intervention Arm:</span> [Selected Arm Name]</p> {/* Display selected arm */}
                  </div>

                  <div className="flex items-start space-x-3 rounded-md border border-yellow-200 bg-yellow-50 p-4">
                    <Info className="h-5 w-5 text-yellow-700 mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium text-yellow-800">Provider Attestation</p>
                      <p className="text-xs text-yellow-700">
                        By proceeding, you confirm that the patient meets the eligibility criteria, understands
                        the trial details, and has provided informed consent.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handlePreviousStep} disabled={currentStep === 1}>
              Previous
            </Button>
            <Button onClick={handleNextStep} disabled={!selectedTrial && currentStep === 1}>
              {currentStep === 3 ? "Complete Enrollment" : "Next"}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="mt-4">Enrollment Successful</CardTitle>
            <CardDescription>Patient {patientData.name} has been enrolled in the trial.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm"><span className="font-semibold">Trial:</span> {selectedTrialData?.name}</p>
            <p className="text-sm"><span className="font-semibold">Assigned Intervention:</span> [Selected Arm Name]</p> {/* Display selected arm */}
          </CardContent>
          <CardFooter className="flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href={`/provider/intervention-assignment/${patientId}`}>
              <Button>Assign Intervention Details</Button>
            </Link>
            <Link href="/provider/dashboard">
              <Button variant="outline">Return to Dashboard</Button>
            </Link>
          </CardFooter>
        </Card>
      )}
    </>
  )
} 
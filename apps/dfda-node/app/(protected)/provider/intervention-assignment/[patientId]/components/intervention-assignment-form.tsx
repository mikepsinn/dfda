"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Brain, Check, ChevronRight, FileText, Info, Pill, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface Intervention {
  id: number;
  name: string;
  description: string;
  details: string;
  frequency: string;
  route: string;
  duration: string;
  monitoring: string;
  sideEffects: { name: string; frequency: string; }[];
  contraindications: string[];
}

interface InterventionAssignmentFormProps {
  patientId: string;
}

export function InterventionAssignmentForm({ patientId }: InterventionAssignmentFormProps) {
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null)
  const [clinicalNotes, setClinicalNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  // Mock patient data (fetch based on patientId)
  const patient = {
    id: patientId,
    name: "James Wilson",
    age: 74,
    gender: "Male",
    condition: "Early Alzheimer's Disease",
    trial: "Lecanemab for Early Alzheimer's Disease",
    enrollmentDate: "March 15, 2025",
    nextVisit: "May 15, 2025",
    medicalHistory: [
      { condition: "Hypertension", since: "2018", medications: ["Lisinopril 10mg daily"] },
      { condition: "Mild Cognitive Impairment", since: "2023", medications: ["Donepezil 5mg daily"] },
      { condition: "Hyperlipidemia", since: "2019", medications: ["Atorvastatin 20mg daily"] },
    ],
    recentAssessments: [
      { name: "Mini-Mental State Examination (MMSE)", date: "March 15, 2025", score: "24/30" },
      { name: "Clinical Dementia Rating (CDR)", date: "March 15, 2025", score: "0.5" },
      { name: "Geriatric Depression Scale", date: "March 15, 2025", score: "3/15" },
    ],
    allergies: ["Penicillin"],
    biomarkers: [
      { name: "Amyloid PET Scan", date: "February 28, 2025", result: "Positive for amyloid plaques" },
      { name: "CSF Aβ42", date: "February 28, 2025", result: "Decreased (compatible with AD)" },
      { name: "CSF p-tau", date: "February 28, 2025", result: "Elevated (compatible with AD)" },
    ],
  }

  // Mock intervention options (fetch based on trial/patient)
  const interventionOptions = [
    {
      id: 1,
      name: "Lecanemab (Aduhelm) 10mg/kg IV",
      description: "Intravenous infusion administered every two weeks",
      details:
        "Monoclonal antibody targeting amyloid beta plaques. Requires pre-medication with antihistamine and monitoring for ARIA (Amyloid-Related Imaging Abnormalities).",
      frequency: "Every 2 weeks",
      route: "Intravenous",
      duration: "Infusion over approximately 1 hour",
      monitoring: "Vital signs before, during, and after infusion. MRI at baseline and weeks 14, 22, 30, 42, 54, 66.",
      sideEffects: [
        { name: "ARIA-E (edema)", frequency: "12.6%" },
        { name: "ARIA-H (microhemorrhages)", frequency: "17.3%" },
        { name: "Infusion-related reactions", frequency: "26%" },
        { name: "Headache", frequency: "11.7%" },
      ],
      contraindications: ["More than 4 microhemorrhages", "Brain hemorrhage", "Anticoagulation therapy"],
    },
    {
      id: 2,
      name: "Lecanemab (Aduhelm) 5mg/kg IV",
      description: "Lower dose intravenous infusion administered every two weeks",
      details: "Reduced dose for patients with APOE ε4 homozygotes or history of microhemorrhages (1-2).",
      frequency: "Every 2 weeks",
      route: "Intravenous",
      duration: "Infusion over approximately 1 hour",
      monitoring: "Vital signs before, during, and after infusion. MRI at baseline and weeks 14, 22, 30, 42, 54, 66.",
      sideEffects: [
        { name: "ARIA-E (edema)", frequency: "8.7%" },
        { name: "ARIA-H (microhemorrhages)", frequency: "13.1%" },
        { name: "Infusion-related reactions", frequency: "20%" },
        { name: "Headache", frequency: "9.2%" },
      ],
      contraindications: ["More than 4 microhemorrhages", "Brain hemorrhage", "Anticoagulation therapy"],
    },
    {
      id: 3,
      name: "Standard of Care (Control)",
      description: "Continuation of current Alzheimer's medications",
      details: "Maintain current Donepezil 5mg daily. No additional anti-amyloid therapy.",
      frequency: "Daily",
      route: "Oral",
      duration: "Ongoing",
      monitoring: "Standard clinical assessments at scheduled visits",
      sideEffects: [
        { name: "Nausea", frequency: "11%" },
        { name: "Diarrhea", frequency: "10%" },
        { name: "Insomnia", frequency: "9%" },
        { name: "Fatigue", frequency: "8%" },
      ],
      contraindications: ["None specific to this arm"],
    },
  ]

  const handleSubmit = () => {
    if (!selectedIntervention) return; // Ensure an intervention is selected
    setIsSubmitting(true)
    console.log("Submitting intervention:", selectedIntervention.name, "for patient:", patientId, "Notes:", clinicalNotes);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false)
      setIsSuccess(true)
    }, 1500)
  }

  return (
    <>
      {isSuccess ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="rounded-full bg-green-100 p-3">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="mt-4 text-2xl font-bold">Intervention Successfully Assigned</h2>
              <p className="mt-2 text-muted-foreground">
                You have successfully assigned {selectedIntervention?.name} to {patient.name}.
              </p>
              <div className="mt-6 flex gap-4">
                <Link href="/app/(protected)/provider/dashboard">
                  <Button variant="outline">Return to Dashboard</Button>
                </Link>
                <Link href={`/app/(protected)/provider/patients/${patientId}`}>
                  <Button>View Patient</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
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
                      {patient.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">{patient.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {patient.age} years • {patient.gender}
                    </p>
                    <Badge className="mt-1">{patient.condition}</Badge>
                  </div>
                </div>
                <Separator />
                {/* Trial Enrollment */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Trial Enrollment</h3>
                  <div className="rounded-lg bg-muted p-3">
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4 text-primary" />
                      <span className="font-medium">{patient.trial}</span>
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">Enrolled on {patient.enrollmentDate}</div>
                  </div>
                </div>
                {/* Medical History */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Medical History</h3>
                  <div className="space-y-2">
                    {patient.medicalHistory.map((item, index) => (
                      <div key={index} className="rounded-lg border p-2">
                        <div className="font-medium">{item.condition}</div>
                        <div className="text-xs text-muted-foreground">Since {item.since}</div>
                        {item.medications.length > 0 && (
                          <div className="mt-1 text-xs">
                            <span className="font-medium">Medications: </span>
                            {item.medications.join(", ")}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                {/* Recent Assessments */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Recent Assessments</h3>
                  <div className="space-y-2">
                    {patient.recentAssessments.map((assessment, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{assessment.name}</span>
                        <span className="font-medium">{assessment.score}</span>
                      </div>
                    ))}
                  </div>
                </div>
                 {/* Biomarkers */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Biomarkers</h3>
                  <div className="space-y-2">
                    {patient.biomarkers.map((biomarker, index) => (
                      <div key={index} className="text-sm">
                        <div className="font-medium">{biomarker.name}</div>
                        <div className="text-xs text-muted-foreground">{biomarker.date}</div>
                        <div className="text-xs">{biomarker.result}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Allergies */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Allergies</h3>
                  <p className="text-sm text-muted-foreground">{patient.allergies.join(", ") || "None reported"}</p>
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
                  Select the intervention arm for this patient based on the trial protocol and patient factors.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  onValueChange={(value) => {
                    const selected = interventionOptions.find((opt) => opt.id.toString() === value);
                    setSelectedIntervention(selected || null);
                  }}
                >
                  <div className="space-y-4">
                    {interventionOptions.map((option) => (
                      <div key={option.id} className="flex items-start space-x-3 rounded-lg border p-4 transition-colors hover:bg-muted/50">
                        <RadioGroupItem value={option.id.toString()} id={`intervention-${option.id}`} className="mt-1" />
                        <div className="flex-1 grid gap-1.5">
                          <Label htmlFor={`intervention-${option.id}`} className="font-semibold cursor-pointer">
                            {option.name}
                          </Label>
                          <p className="text-sm text-muted-foreground">{option.description}</p>
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
                              </ul>
                              <p className="font-medium mb-1">Contraindications:</p>
                              <ul className="list-disc pl-4">
                                {option.contraindications.map((ci, i) => <li key={i}>{ci}</li>)}
                              </ul>
                            </TabsContent>
                          </Tabs>
                        </div>
                      </div>
                    ))}
                  </div>
                </RadioGroup>

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
                  disabled={!selectedIntervention || isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Assign Intervention & Proceed"}
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
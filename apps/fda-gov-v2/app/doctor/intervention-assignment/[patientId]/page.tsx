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

export default function InterventionAssignment({ params }) {
  const patientId = params.patientId
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null)
  const [clinicalNotes, setClinicalNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  // Mock patient data
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

  // Mock intervention options
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
    setIsSubmitting(true)
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false)
      setIsSuccess(true)
    }, 1500)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 py-6 md:py-10">
        <div className="container">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8 flex items-center gap-2">
              <Link href="/doctor/dashboard" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back to dashboard</span>
              </Link>
              <h1 className="text-2xl font-bold">Intervention Assignment</h1>
            </div>

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
                      <Link href="/doctor/dashboard">
                        <Button variant="outline">Return to Dashboard</Button>
                      </Link>
                      <Link href={`/doctor/patients/${patientId}`}>
                        <Button>View Patient</Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-1">
                  <Card>
                    <CardHeader>
                      <CardTitle>Patient Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
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

                      <div>
                        <h3 className="text-sm font-medium mb-2">Allergies</h3>
                        <div className="flex flex-wrap gap-1">
                          {patient.allergies.map((allergy, index) => (
                            <Badge key={index} variant="destructive">
                              {allergy}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-center">
                        <Link href={`/doctor/patients/${patientId}`}>
                          <Button variant="outline" size="sm">
                            <User className="mr-2 h-4 w-4" />
                            Full Patient Record
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="md:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Assign Intervention</CardTitle>
                      <CardDescription>
                        Select the appropriate intervention for this patient based on their clinical profile
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Alert className="mb-6">
                        <Info className="h-4 w-4" />
                        <AlertTitle>Pragmatic Trial Design</AlertTitle>
                        <AlertDescription>
                          This trial uses a pragmatic design where you, as the treating physician, select the most
                          appropriate intervention based on the patient's clinical profile and your medical judgment.
                        </AlertDescription>
                      </Alert>

                      <div className="space-y-6">
                        <RadioGroup
                          value={selectedIntervention?.id ? String(selectedIntervention.id) : undefined}
                          onValueChange={(value) => {
                            const found = interventionOptions.find((o) => o.id === Number.parseInt(value));
                            if (found) {
                              setSelectedIntervention(found);
                            }
                          }}
                        >
                          {interventionOptions.map((option) => (
                            <div key={option.id} className="rounded-lg border p-4">
                              <div className="flex items-start space-x-2">
                                <RadioGroupItem value={String(option.id)} id={`option-${option.id}`} className="mt-1" />
                                <div className="flex-1">
                                  <Label htmlFor={`option-${option.id}`} className="text-base font-medium">
                                    {option.name}
                                  </Label>
                                  <p className="text-sm text-muted-foreground mt-1">{option.description}</p>

                                  <Tabs defaultValue="details" className="mt-4">
                                    <TabsList className="grid w-full grid-cols-4">
                                      <TabsTrigger value="details">Details</TabsTrigger>
                                      <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
                                      <TabsTrigger value="side-effects">Side Effects</TabsTrigger>
                                      <TabsTrigger value="contraindications">Contraindications</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="details" className="space-y-4 pt-4">
                                      <p className="text-sm">{option.details}</p>
                                      <div className="grid grid-cols-3 gap-2">
                                        <div className="rounded-lg bg-muted p-2">
                                          <div className="text-xs text-muted-foreground">Frequency</div>
                                          <div className="font-medium text-sm">{option.frequency}</div>
                                        </div>
                                        <div className="rounded-lg bg-muted p-2">
                                          <div className="text-xs text-muted-foreground">Route</div>
                                          <div className="font-medium text-sm">{option.route}</div>
                                        </div>
                                        <div className="rounded-lg bg-muted p-2">
                                          <div className="text-xs text-muted-foreground">Duration</div>
                                          <div className="font-medium text-sm">{option.duration}</div>
                                        </div>
                                      </div>
                                    </TabsContent>
                                    <TabsContent value="monitoring" className="pt-4">
                                      <p className="text-sm">{option.monitoring}</p>
                                    </TabsContent>
                                    <TabsContent value="side-effects" className="pt-4">
                                      <div className="space-y-2">
                                        {option.sideEffects.map((effect, index) => (
                                          <div key={index} className="flex justify-between text-sm">
                                            <span>{effect.name}</span>
                                            <span className="font-medium">{effect.frequency}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </TabsContent>
                                    <TabsContent value="contraindications" className="pt-4">
                                      <ul className="list-disc pl-5 text-sm space-y-1">
                                        {option.contraindications.map((item, index) => (
                                          <li key={index}>{item}</li>
                                        ))}
                                      </ul>
                                    </TabsContent>
                                  </Tabs>
                                </div>
                              </div>
                            </div>
                          ))}
                        </RadioGroup>

                        <div className="space-y-2">
                          <Label htmlFor="clinical-notes">Clinical Notes</Label>
                          <Textarea
                            id="clinical-notes"
                            placeholder="Enter your clinical rationale for selecting this intervention..."
                            value={clinicalNotes}
                            onChange={(e) => setClinicalNotes(e.target.value)}
                            className="min-h-[120px]"
                          />
                        </div>

                        <div className="rounded-lg border p-4 bg-muted/50">
                          <div className="flex items-start gap-4">
                            <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                              <h3 className="font-medium">Documentation Requirements</h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                Your intervention assignment and clinical notes will be documented in both the trial
                                database and the patient's electronic health record. This information may be reviewed by
                                the trial sponsor and regulatory authorities.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <Button variant="outline" disabled={!selectedIntervention}>
                                <Pill className="mr-2 h-4 w-4" />
                                Preview Order
                              </Button>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Preview the intervention order before submission</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <Button
                        onClick={handleSubmit}
                        disabled={!selectedIntervention || clinicalNotes.length < 10 || isSubmitting}
                      >
                        {isSubmitting ? "Submitting..." : "Assign Intervention"}
                        {!isSubmitting && <ChevronRight className="ml-2 h-4 w-4" />}
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}


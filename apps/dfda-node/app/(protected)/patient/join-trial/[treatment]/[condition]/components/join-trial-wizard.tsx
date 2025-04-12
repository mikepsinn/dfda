"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  ChevronRight,
  FileText,
  CheckCircle,
  AlertCircle,
  Calendar,
  Building,
  Activity,
  Lock,
  Smartphone,
  FileCheck,
  Clipboard,
  ChevronDown,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Mock data for the trial - specific known trials
const knownTrialData = {
  Metformin: {
    "Type 2 Diabetes": {
      title: "Metformin Extended Release for Type 2 Diabetes",
      description:
        "This trial evaluates the effectiveness of Metformin Extended Release formulation in managing blood glucose levels in patients with Type 2 Diabetes.",
      duration: "6 months",
      visits: "Remote monitoring only, no in-person visits required",
      eligibility: [
        "Diagnosed with Type 2 Diabetes for at least 6 months",
        "HbA1c between 7.0% and 10.0%",
        "Age 18-75",
        "Not currently taking insulin",
      ],
      interventions: [
        "Metformin Extended Release 500mg daily for first week",
        "Metformin Extended Release 1000mg daily for remainder of trial",
      ],
      outcomes: [
        "Primary: Change in HbA1c at 6 months",
        "Secondary: Fasting blood glucose, weight change, medication adherence",
      ],
      sideEffects: [
        { name: "Gastrointestinal discomfort", percentage: 25 },
        { name: "B12 deficiency", percentage: 6 },
        { name: "Headache", percentage: 5 },
      ],
      cost: 199,
      refundPolicy: "80% refund if all data submissions are completed",
      research_partners: "FDA v2 Diabetes Research Consortium",
    },
  },
  "TNF Inhibitors": {
    "Rheumatoid Arthritis": {
      title: "TNF Inhibitor Therapy for Rheumatoid Arthritis",
      description:
        "This trial evaluates the effectiveness of TNF inhibitor therapy in reducing inflammation and pain in patients with Rheumatoid Arthritis.",
      duration: "12 months",
      visits: "Remote monitoring with quarterly virtual check-ins",
      eligibility: [
        "Diagnosed with Rheumatoid Arthritis for at least 1 year",
        "Currently experiencing moderate to severe symptoms",
        "Age 18-70",
        "Failed at least one conventional DMARD therapy",
      ],
      interventions: [
        "Self-administered TNF inhibitor injection every 2 weeks",
        "Daily symptom tracking via mobile app",
      ],
      outcomes: [
        "Primary: Change in Disease Activity Score (DAS28) at 6 and 12 months",
        "Secondary: Pain scores, functional ability, quality of life measures",
      ],
      sideEffects: [
        { name: "Injection site reactions", percentage: 18 },
        { name: "Increased infection risk", percentage: 12 },
        { name: "Headache", percentage: 8 },
      ],
      cost: 299,
      refundPolicy: "75% refund if all data submissions are completed",
      research_partners: "FDA v2 Rheumatology Research Network",
    },
  },
}

// Steps in the join trial process
const steps = [
  { id: "trial-info", name: "Trial Information" },
  { id: "informed-consent", name: "Informed Consent" },
  { id: "baseline-assessment", name: "Baseline Assessment" },
  { id: "schedule-labs", name: "Schedule Labs" },
  { id: "payment", name: "Payment" },
  { id: "delivery-setup", name: "Delivery Setup" },
  { id: "data-sharing", name: "Data Sharing" },
  { id: "confirmation", name: "Confirmation" },
]

interface JoinTrialWizardProps {
  treatment: string
  condition: string
}

export default function JoinTrialWizard({ treatment, condition }: JoinTrialWizardProps) {
  const router = useRouter()

  const [currentStep, setCurrentStep] = useState(0)
  const [consentAnswers, setConsentAnswers] = useState({
    q1: false,
    q2: false,
    q3: false,
    q4: false,
    q5: false,
  })
  const [deliveryOption, setDeliveryOption] = useState("pharmacy")
  const [dataSharing, setDataSharing] = useState({
    ehr: false,
    wearables: false,
    healthApps: false,
  })

  // Get trial data based on treatment and condition
  let trial = knownTrialData[treatment]?.[condition]

  // If trial data doesn't exist, generate it dynamically
  if (!trial) {
    trial = {
      title: `${treatment} for ${condition}`,
      description: `This trial evaluates the effectiveness of ${treatment} in patients with ${condition}.`,
      duration: "6 months",
      visits: "Remote monitoring with optional virtual check-ins",
      eligibility: [
        `Diagnosed with ${condition} for at least 6 months`,
        "Age 18-75",
        "No severe comorbidities",
        "Not pregnant or planning to become pregnant",
      ],
      interventions: [
        `${treatment} administered according to standard dosing guidelines`,
        "Daily symptom tracking via mobile app",
      ],
      outcomes: [
        `Primary: Improvement in ${condition} symptoms at 3 and 6 months`,
        "Secondary: Quality of life measures, medication adherence, side effect profile",
      ],
      sideEffects: [
        { name: "Headache", percentage: Math.floor(Math.random() * 15) + 5 },
        { name: "Nausea", percentage: Math.floor(Math.random() * 20) + 3 },
        { name: "Fatigue", percentage: Math.floor(Math.random() * 12) + 8 },
      ],
      cost: Math.floor(Math.random() * 200) + 99,
      refundPolicy: "75% refund if all data submissions are completed",
      research_partners: "FDA v2 Research Consortium",
    }
  }

  const progress = ((currentStep + 1) / steps.length) * 100

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
      window.scrollTo(0, 0)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      window.scrollTo(0, 0)
    } else {
      router.back() // Go back to previous page if on the first step
    }
  }

  const handleConsentChange = (question: string, checked: boolean) => {
    setConsentAnswers((prev) => ({
      ...prev,
      [question]: checked,
    }))
  }

  const handleDataSharingChange = (item: string, checked: boolean) => {
    setDataSharing((prev) => ({
      ...prev,
      [item]: checked,
    }))
  }

  const allConsentAnswered = Object.values(consentAnswers).every((value) => value === true)

  // Function to navigate to payment page
  const handleProceedToPayment = () => {
    // In a real app, you'd pass necessary data like trial ID, amount, etc.
    router.push(`/patient/trial-payment/${encodeURIComponent(treatment)}-${encodeURIComponent(condition)}`)
  }

  return (
    <div className="container py-6 md:py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Button variant="ghost" size="icon" onClick={handleBack} className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Button>
            <h1 className="text-2xl font-bold">Join Clinical Trial</h1>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>
                Step {currentStep + 1} of {steps.length}: {steps[currentStep].name}
              </span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {/* Step 1: Trial Information */}
        {currentStep === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{trial.title}</CardTitle>
              <CardDescription>Review the trial details before proceeding</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">Trial Overview</h3>
                <p className="text-muted-foreground">{trial.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-medium">Duration</h4>
                  <p className="text-sm text-muted-foreground">{trial.duration}</p>
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-medium">Visits Required</h4>
                  <p className="text-sm text-muted-foreground">{trial.visits}</p>
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-medium">Cost</h4>
                  <p className="text-sm text-muted-foreground">
                    ${trial.cost} (with {trial.refundPolicy})
                  </p>
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-medium">Sponsor</h4>
                  <p className="text-sm text-muted-foreground">{trial.research_partners}</p>
                </div>
              </div>
              <Separator />
              <div>
                <h3 className="font-medium mb-2">Eligibility Criteria</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  {trial.eligibility.map((criterion, index) => (
                    <li key={index}>{criterion}</li>
                  ))}
                </ul>
              </div>
              <Separator />
              <div>
                <h3 className="font-medium mb-2">What You'll Do (Interventions)</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  {trial.interventions.map((intervention, index) => (
                    <li key={index}>{intervention}</li>
                  ))}
                </ul>
              </div>
              <Separator />
              <div>
                <h3 className="font-medium mb-2">What We'll Measure (Outcomes)</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  {trial.outcomes.map((outcome, index) => (
                    <li key={index}>{outcome}</li>
                  ))}
                </ul>
              </div>
              <Separator />
              <div>
                <h3 className="font-medium mb-2">Potential Side Effects</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  {trial.sideEffects.map((effect, index) => (
                    <li key={index}>
                      {effect.name} (Reported in ~{effect.percentage}% of participants in similar trials)
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-muted-foreground mt-2">
                  Note: This is not an exhaustive list. Full safety information will be provided.
                </p>
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button onClick={handleNext}>Next: Informed Consent <ChevronRight className="h-4 w-4 ml-2" /></Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 2: Informed Consent */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Informed Consent</CardTitle>
              <CardDescription>Please read carefully and confirm your understanding.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4 p-4 border rounded-md max-h-96 overflow-y-auto">
                <h4 className="font-medium flex items-center">
                  <FileText className="h-5 w-5 mr-2" /> Full Consent Document (Summary)
                </h4>
                <p>You are being asked to participate in a research study titled "{trial.title}".</p>
                <p><strong>Purpose:</strong> {trial.description}</p>
                <p><strong>Procedures:</strong> {trial.interventions.join("; ")}</p>
                <p><strong>Duration:</strong> Your participation will last approximately {trial.duration}.</p>
                <p>
                  <strong>Risks and Discomforts:</strong> Potential side effects include:
                  {trial.sideEffects.map((e) => `${e.name} (~${e.percentage}%)`).join(", ")}.
                  There may be other risks not yet known.
                </p>
                <p><strong>Benefits:</strong> You may not directly benefit from participating. Potential benefits to others include increased understanding of {condition}.</p>
                <p><strong>Confidentiality:</strong> Your data will be kept confidential and used only for research purposes. Anonymized data may be shared with regulatory agencies like the FDA and research partners ({trial.research_partners}).</p>
                <p><strong>Voluntary Participation:</strong> Your participation is voluntary. You can withdraw at any time without penalty.</p>
                <p><strong>Compensation/Cost:</strong> The cost to participate is ${trial.cost}. {trial.refundPolicy}.</p>
                <p><strong>Contact Information:</strong> If you have questions, contact the study team at [Study Contact Info - Placeholder].</p>
                <p className="mt-4 font-bold">
                  By proceeding, you indicate that you have read and understood the information provided.
                </p>
                {/* Placeholder for full document link */}
                <Button variant="link" asChild className="p-0 h-auto">
                  <Link href="#" target="_blank" rel="noopener noreferrer">
                    Download Full Consent Document (PDF)
                  </Link>
                </Button>
              </div>
              <Separator />
              <div>
                <h4 className="font-medium mb-4">Consent Confirmation</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="consent-q1" checked={consentAnswers.q1} onCheckedChange={(checked) => handleConsentChange("q1", !!checked)} />
                    <Label htmlFor="consent-q1" className="cursor-pointer">
                      I confirm that I have read and understood the purpose and procedures of the trial.
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="consent-q2" checked={consentAnswers.q2} onCheckedChange={(checked) => handleConsentChange("q2", !!checked)} />
                    <Label htmlFor="consent-q2" className="cursor-pointer">
                      I understand the potential risks and benefits involved.
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="consent-q3" checked={consentAnswers.q3} onCheckedChange={(checked) => handleConsentChange("q3", !!checked)} />
                    <Label htmlFor="consent-q3" className="cursor-pointer">
                      I understand that my participation is voluntary and I can withdraw at any time.
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="consent-q4" checked={consentAnswers.q4} onCheckedChange={(checked) => handleConsentChange("q4", !!checked)} />
                    <Label htmlFor="consent-q4" className="cursor-pointer">
                      I understand how my data will be used and kept confidential.
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="consent-q5" checked={consentAnswers.q5} onCheckedChange={(checked) => handleConsentChange("q5", !!checked)} />
                    <Label htmlFor="consent-q5" className="cursor-pointer">
                      I agree to participate in this clinical trial.
                    </Label>
                  </div>
                </div>
                {!allConsentAnswered && (
                  <p className="text-sm text-red-600 mt-3 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" /> Please check all boxes to proceed.
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter className="justify-between">
              <Button variant="outline" onClick={handleBack}>Back</Button>
              <Button onClick={handleNext} disabled={!allConsentAnswered}>
                Next: Baseline Assessment <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 3: Baseline Assessment */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Baseline Assessment</CardTitle>
              <CardDescription>Complete a short health questionnaire.</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Placeholder for a form/questionnaire component */}
              <div className="text-center text-muted-foreground py-8">
                <Clipboard className="h-12 w-12 mx-auto mb-4" />
                <p>Baseline Assessment Questionnaire will be displayed here.</p>
                <p>(Integration with form engine or survey tool)</p>
                <Button variant="outline" className="mt-4">
                  Start Assessment (Simulated)
                </Button>
              </div>
            </CardContent>
            <CardFooter className="justify-between">
              <Button variant="outline" onClick={handleBack}>Back</Button>
              {/* Add disabled state based on assessment completion */}
              <Button onClick={handleNext}>Next: Schedule Labs <ChevronRight className="h-4 w-4 ml-2" /></Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 4: Schedule Labs */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Schedule Lab Work</CardTitle>
              <CardDescription>Schedule required baseline lab tests.</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Placeholder for lab scheduling component */}
              <div className="text-center text-muted-foreground py-8">
                <Calendar className="h-12 w-12 mx-auto mb-4" />
                <p>Lab Scheduling Interface will be displayed here.</p>
                <p>(Integration with LabCorp/Quest or similar)</p>
                <Button variant="outline" className="mt-4">
                  Find Lab Location (Simulated)
                </Button>
              </div>
            </CardContent>
            <CardFooter className="justify-between">
              <Button variant="outline" onClick={handleBack}>Back</Button>
              {/* Add disabled state based on lab scheduling */}
              <Button onClick={handleNext}>Next: Payment <ChevronRight className="h-4 w-4 ml-2" /></Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 5: Payment */}
        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
              <CardDescription>Securely pay the trial participation fee.</CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-lg font-semibold">Trial Cost: ${trial.cost}</p>
              <p className="text-sm text-muted-foreground">{trial.refundPolicy}</p>
              <Button size="lg" onClick={handleProceedToPayment}>
                Proceed to Secure Payment <Lock className="h-4 w-4 ml-2" />
              </Button>
              <p className="text-xs text-muted-foreground">You will be redirected to our payment partner.</p>
            </CardContent>
            <CardFooter className="justify-between">
              <Button variant="outline" onClick={handleBack}>Back</Button>
              {/* Next button might be removed or disabled until payment is confirmed via webhook/callback */}
              <Button onClick={handleNext}>Next: Delivery Setup <ChevronRight className="h-4 w-4 ml-2" /></Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 6: Delivery Setup */}
        {currentStep === 5 && (
          <Card>
            <CardHeader>
              <CardTitle>Medication Delivery Setup</CardTitle>
              <CardDescription>Choose how you'd like to receive the trial medication.</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup defaultValue={deliveryOption} onValueChange={setDeliveryOption} className="space-y-4">
                <Label className="flex items-center gap-4 p-4 border rounded-md cursor-pointer hover:bg-accent">
                  <RadioGroupItem value="pharmacy" id="pharmacy" />
                  <div className="flex-1">
                    <span className="font-medium">Local Pharmacy Pickup</span>
                    <p className="text-sm text-muted-foreground">Pick up medication from a participating pharmacy near you.</p>
                  </div>
                  <Building className="h-6 w-6 text-muted-foreground" />
                </Label>
                <Label className="flex items-center gap-4 p-4 border rounded-md cursor-pointer hover:bg-accent">
                  <RadioGroupItem value="direct" id="direct" />
                  <div className="flex-1">
                    <span className="font-medium">Direct Home Delivery</span>
                    <p className="text-sm text-muted-foreground">Receive medication directly to your home address via courier.</p>
                  </div>
                  <Smartphone className="h-6 w-6 text-muted-foreground" />
                </Label>
              </RadioGroup>
              {/* Add address form if direct delivery is selected */}
              {deliveryOption === "direct" && (
                <div className="mt-6 p-4 border rounded-md">
                  <h4 className="font-medium mb-3">Delivery Address</h4>
                  {/* Placeholder for address form fields */}
                  <p className="text-sm text-muted-foreground">Address form fields go here...</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="justify-between">
              <Button variant="outline" onClick={handleBack}>Back</Button>
              <Button onClick={handleNext}>Next: Data Sharing <ChevronRight className="h-4 w-4 ml-2" /></Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 7: Data Sharing Preferences */}
        {currentStep === 6 && (
          <Card>
            <CardHeader>
              <CardTitle>Data Sharing Preferences</CardTitle>
              <CardDescription>Choose which additional data sources you'd like to share.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Sharing data from these sources can provide valuable context for the research. Participation is optional.</p>
              <div className="flex items-center space-x-2">
                <Checkbox id="data-ehr" checked={dataSharing.ehr} onCheckedChange={(checked) => handleDataSharingChange("ehr", !!checked)} />
                <Label htmlFor="data-ehr" className="flex-1 cursor-pointer">
                  Electronic Health Records (EHR)
                  <span className="block text-xs text-muted-foreground">Securely connect to your provider's portal.</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="data-wearables" checked={dataSharing.wearables} onCheckedChange={(checked) => handleDataSharingChange("wearables", !!checked)} />
                <Label htmlFor="data-wearables" className="flex-1 cursor-pointer">
                  Wearable Devices (Fitbit, Apple Watch, etc.)
                  <span className="block text-xs text-muted-foreground">Share activity, sleep, and heart rate data.</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="data-healthapps" checked={dataSharing.healthApps} onCheckedChange={(checked) => handleDataSharingChange("healthApps", !!checked)} />
                <Label htmlFor="data-healthapps" className="flex-1 cursor-pointer">
                  Other Health Apps (MyFitnessPal, Glucose Monitors, etc.)
                  <span className="block text-xs text-muted-foreground">Connect other relevant health tracking apps.</span>
                </Label>
              </div>
            </CardContent>
            <CardFooter className="justify-between">
              <Button variant="outline" onClick={handleBack}>Back</Button>
              <Button onClick={handleNext}>Next: Confirmation <ChevronRight className="h-4 w-4 ml-2" /></Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 8: Confirmation */}
        {currentStep === 7 && (
          <Card>
            <CardHeader className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <CardTitle>Enrollment Complete!</CardTitle>
              <CardDescription>You have successfully enrolled in the {trial.title} trial.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p>Thank you for joining! You will receive further instructions via email within 24 hours.</p>
              <p className="text-muted-foreground">
                Your medication will be available via {deliveryOption === "pharmacy" ? "your selected local pharmacy" : "direct home delivery"}
                around [Estimated Delivery Date - Placeholder].
              </p>
              {/* Summary of choices could go here */}
            </CardContent>
            <CardFooter className="flex-col gap-4">
              <Button size="lg" asChild>
                <Link href="/patient/dashboard">Go to Patient Dashboard</Link>
              </Button>
              <Button variant="outline" onClick={handleBack}>Review Previous Steps</Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  )
} 
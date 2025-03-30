"use client"

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
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

// Mock data for the trial
const trialData = {
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

export default function JoinTrialPage() {
  const router = useRouter()
  const params = useParams()
  const treatment = decodeURIComponent(params.treatment as string)
  const condition = decodeURIComponent(params.condition as string)

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
  let trial = trialData[treatment]?.[condition]

  // If trial data doesn't exist, generate it dynamically
  if (!trial) {
    // Generate mock trial data based on treatment and condition
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
    }
  }

  const handleConsentChange = (question, checked) => {
    setConsentAnswers({
      ...consentAnswers,
      [question]: checked,
    })
  }

  const handleDataSharingChange = (item, checked) => {
    setDataSharing({
      ...dataSharing,
      [item]: checked,
    })
  }

  const allConsentAnswered = Object.values(consentAnswers).every((value) => value === true)

  return (
    <div className="container py-6 md:py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8">
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

              <Tabs defaultValue="eligibility">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="eligibility">Eligibility</TabsTrigger>
                  <TabsTrigger value="interventions">Interventions</TabsTrigger>
                  <TabsTrigger value="outcomes">Outcomes</TabsTrigger>
                  <TabsTrigger value="side-effects">Side Effects</TabsTrigger>
                </TabsList>
                <TabsContent value="eligibility" className="space-y-4 pt-4">
                  <h3 className="font-medium">Eligibility Criteria</h3>
                  <ul className="space-y-2">
                    {trial.eligibility.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </TabsContent>
                <TabsContent value="interventions" className="space-y-4 pt-4">
                  <h3 className="font-medium">Intervention Details</h3>
                  <ul className="space-y-2">
                    {trial.interventions.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <FileText className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </TabsContent>
                <TabsContent value="outcomes" className="space-y-4 pt-4">
                  <h3 className="font-medium">Outcome Measurements</h3>
                  <ul className="space-y-2">
                    {trial.outcomes.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Activity className="h-5 w-5 text-purple-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </TabsContent>
                <TabsContent value="side-effects" className="space-y-4 pt-4">
                  <h3 className="font-medium">Potential Side Effects</h3>
                  <ul className="space-y-2">
                    {trial.sideEffects.map((effect, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                        <span>
                          {effect.name}: {effect.percentage}% of patients
                        </span>
                      </li>
                    ))}
                  </ul>
                </TabsContent>
              </Tabs>

              <div className="rounded-lg border p-4 bg-muted/50">
                <div className="flex items-start gap-3">
                  <FileCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Outcome Label Available</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      This treatment has a comprehensive FDA v2 Outcome Label showing all known effects based on
                      real-world evidence.
                    </p>
                    <Button variant="link" className="p-0 h-auto mt-1" asChild>
                      <Link href={`/outcome-labels?treatment=${treatment}&condition=${condition}`}>
                        View Complete Outcome Label <ChevronRight className="h-3 w-3 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button onClick={handleNext}>Continue to Informed Consent</Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 2: Informed Consent */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Informed Consent</CardTitle>
              <CardDescription>Please review and confirm your understanding of the trial</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg border p-4">
                <h3 className="font-medium mb-2">Informed Consent Quiz</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Please confirm your understanding of the following aspects of the trial by checking each box:
                </p>

                <div className="space-y-4">
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="consent-q1"
                      checked={consentAnswers.q1}
                      onCheckedChange={(checked) => handleConsentChange("q1", checked)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label
                        htmlFor="consent-q1"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        I understand that this trial will last for {trial.duration} and I am committing to complete the
                        entire duration.
                      </Label>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="consent-q2"
                      checked={consentAnswers.q2}
                      onCheckedChange={(checked) => handleConsentChange("q2", checked)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label
                        htmlFor="consent-q2"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        I understand the potential side effects of this treatment, including{" "}
                        {trial.sideEffects.map((e) => e.name).join(", ")}.
                      </Label>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="consent-q3"
                      checked={consentAnswers.q3}
                      onCheckedChange={(checked) => handleConsentChange("q3", checked)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label
                        htmlFor="consent-q3"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        I understand that I will need to submit regular data about my condition and response to
                        treatment.
                      </Label>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="consent-q4"
                      checked={consentAnswers.q4}
                      onCheckedChange={(checked) => handleConsentChange("q4", checked)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label
                        htmlFor="consent-q4"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        I understand that my anonymized data will be used to improve the FDA v2 Outcome Label for this
                        treatment.
                      </Label>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="consent-q5"
                      checked={consentAnswers.q5}
                      onCheckedChange={(checked) => handleConsentChange("q5", checked)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label
                        htmlFor="consent-q5"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        I understand that I will pay ${trial.cost} to join this trial, with {trial.refundPolicy}.
                      </Label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-4 bg-muted/50">
                <div className="flex items-start gap-3">
                  <Clipboard className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Full Informed Consent Document</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      The complete informed consent document contains additional details about the trial procedures,
                      risks, benefits, and your rights.
                    </p>
                    <Button variant="link" className="p-0 h-auto mt-1">
                      Download Full Consent Document <ChevronDown className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button onClick={handleNext} disabled={!allConsentAnswered}>
                Continue to Baseline Assessment
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 3: Baseline Assessment */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Baseline Assessment</CardTitle>
              <CardDescription>Please provide your current health information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  The baseline assessment collects information about your current health status, symptoms, and medical
                  history. This information will be used to track your progress throughout the trial.
                </p>

                <div className="rounded-lg border p-4">
                  <h3 className="font-medium mb-3">Baseline Assessment Form</h3>
                  <p className="text-sm text-muted-foreground mb-4">This form includes questions about:</p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Current symptoms and severity</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Medical history relevant to {condition}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Current medications and treatments</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Quality of life measures</span>
                    </li>
                  </ul>
                  <Button className="mt-4 w-full">Complete Baseline Assessment</Button>
                </div>

                <div className="rounded-lg border p-4 bg-muted/50">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium">Important Note</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        For demonstration purposes, we're skipping the actual form completion. In a real implementation,
                        this would be a comprehensive health questionnaire.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button onClick={handleNext}>Continue to Schedule Labs</Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 4: Schedule Labs */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Schedule Labs</CardTitle>
              <CardDescription>Schedule your baseline laboratory tests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Before beginning the trial, we need to collect baseline laboratory measurements. These tests will help
                  ensure the treatment is safe for you and provide a baseline for measuring effectiveness.
                </p>

                <div className="rounded-lg border p-4">
                  <h3 className="font-medium mb-3">Required Laboratory Tests</h3>
                  <ul className="space-y-2">
                    {condition === "Type 2 Diabetes" ? (
                      <>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">HbA1c</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Fasting Blood Glucose</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Kidney Function Tests</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Liver Function Tests</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Vitamin B12 Levels</span>
                        </li>
                      </>
                    ) : (
                      <>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Complete Blood Count</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Liver Function Tests</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Tuberculosis Screening</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Hepatitis B and C Screening</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Rheumatoid Factor and Anti-CCP Antibodies</span>
                        </li>
                      </>
                    )}
                  </ul>
                </div>

                <div className="rounded-lg border p-4">
                  <h3 className="font-medium mb-3">Lab Options</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-md">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-primary" />
                        <div>
                          <h4 className="font-medium">Home Collection Kit</h4>
                          <p className="text-sm text-muted-foreground">We'll ship a collection kit to your home</p>
                        </div>
                      </div>
                      <Button size="sm">Select</Button>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-md">
                      <div className="flex items-center gap-3">
                        <Building className="h-5 w-5 text-primary" />
                        <div>
                          <h4 className="font-medium">Local Lab Partner</h4>
                          <p className="text-sm text-muted-foreground">Visit a lab location near you</p>
                        </div>
                      </div>
                      <Button size="sm">Select</Button>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-md">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-primary" />
                        <div>
                          <h4 className="font-medium">Upload Recent Results</h4>
                          <p className="text-sm text-muted-foreground">Use lab results from the past 30 days</p>
                        </div>
                      </div>
                      <Button size="sm">Select</Button>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border p-4 bg-muted/50">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium">Important Note</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        For demonstration purposes, we're skipping the actual lab scheduling. In a real implementation,
                        you would select a lab option and schedule or request your tests.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button onClick={handleNext}>Continue to Payment</Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 5: Payment */}
        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
              <CardDescription>Complete your payment to join the trial</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="rounded-lg border p-4">
                  <h3 className="font-medium mb-3">Trial Cost Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Trial Participation Fee</span>
                      <span className="text-sm font-medium">${trial.cost}.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Medication for {trial.duration}</span>
                      <span className="text-sm font-medium">Included</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Remote Monitoring</span>
                      <span className="text-sm font-medium">Included</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Baseline Lab Tests</span>
                      <span className="text-sm font-medium">Included</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-medium">
                      <span>Total</span>
                      <span>${trial.cost}.00</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <h3 className="font-medium mb-3">Payment Information</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Please enter your payment details to complete your trial enrollment. Your card will be charged $
                    {trial.cost}.00.
                  </p>
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="card-name">Name on Card</Label>
                      <input
                        id="card-name"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="John Smith"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="card-number">Card Number</Label>
                      <input
                        id="card-number"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="4242 4242 4242 4242"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="expiry">Expiry Date</Label>
                        <input
                          id="expiry"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="MM/YY"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="cvc">CVC</Label>
                        <input
                          id="cvc"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="123"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border p-4 bg-muted/50">
                  <div className="flex items-start gap-3">
                    <Lock className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium">Refund Policy</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        You will receive {trial.refundPolicy} if you complete all required data submissions throughout
                        the trial.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button onClick={handleNext}>Complete Payment</Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 6: Delivery Setup */}
        {currentStep === 5 && (
          <Card>
            <CardHeader>
              <CardTitle>Delivery Setup</CardTitle>
              <CardDescription>Choose how you want to receive your treatment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <p className="text-sm text-muted-foreground">
                  Please select how you would like to receive your trial medication. You can choose to have it delivered
                  to your home or pick it up from a local pharmacy.
                </p>

                <RadioGroup value={deliveryOption} onValueChange={setDeliveryOption} className="space-y-4">
                  <div
                    className={`flex items-start space-x-3 rounded-lg border p-4 ${deliveryOption === "home" ? "border-primary bg-primary/5" : ""}`}
                  >
                    <RadioGroupItem value="home" id="delivery-home" className="mt-1" />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="delivery-home" className="text-base font-medium">
                        Home Delivery
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        We'll ship your medication directly to your home address in discreet packaging.
                      </p>
                      {deliveryOption === "home" && (
                        <div className="mt-3 space-y-3">
                          <div className="grid gap-2">
                            <Label htmlFor="address">Delivery Address</Label>
                            <input
                              id="address"
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              placeholder="123 Main St"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-2">
                              <Label htmlFor="city">City</Label>
                              <input
                                id="city"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="New York"
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="zip">ZIP Code</Label>
                              <input
                                id="zip"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="10001"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    className={`flex items-start space-x-3 rounded-lg border p-4 ${deliveryOption === "pharmacy" ? "border-primary bg-primary/5" : ""}`}
                  >
                    <RadioGroupItem value="pharmacy" id="delivery-pharmacy" className="mt-1" />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="delivery-pharmacy" className="text-base font-medium">
                        Local Pharmacy Pickup
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        We'll send your prescription to a local pharmacy where you can pick it up.
                      </p>
                      {deliveryOption === "pharmacy" && (
                        <div className="mt-3 space-y-3">
                          <div className="grid gap-2">
                            <Label htmlFor="pharmacy-search">Find a Pharmacy</Label>
                            <input
                              id="pharmacy-search"
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              placeholder="Enter ZIP code or address"
                            />
                          </div>
                          <Button size="sm" className="mt-2">
                            Search Pharmacies
                          </Button>

                          <div className="rounded-lg border p-3 mt-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium">Walgreens</h4>
                                <p className="text-xs text-muted-foreground">123 Main St, New York, NY 10001</p>
                                <p className="text-xs text-muted-foreground">0.8 miles away</p>
                              </div>
                              <Button size="sm" variant="outline">
                                Select
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    className={`flex items-start space-x-3 rounded-lg border p-4 ${deliveryOption === "provider" ? "border-primary bg-primary/5" : ""}`}
                  >
                    <RadioGroupItem value="provider" id="delivery-provider" className="mt-1" />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="delivery-provider" className="text-base font-medium">
                        My Provider's Office
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        We'll coordinate with your provider to provide the medication at your next visit.
                      </p>
                      {deliveryOption === "provider" && (
                        <div className="mt-3 space-y-3">
                          <div className="grid gap-2">
                            <Label htmlFor="provider-name">Provider's Name</Label>
                            <input
                              id="provider-name"
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              placeholder="Dr. Smith"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="provider-practice">Practice Name</Label>
                            <input
                              id="provider-practice"
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              placeholder="City Medical Group"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="provider-phone">Phone Number</Label>
                            <input
                              id="provider-phone"
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              placeholder="(555) 123-4567"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button onClick={handleNext}>Continue to Data Sharing</Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 7: Data Sharing */}
        {currentStep === 6 && (
          <Card>
            <CardHeader>
              <CardTitle>Data Sharing</CardTitle>
              <CardDescription>Connect your health data to enhance your trial experience</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <p className="text-sm text-muted-foreground">
                  Sharing your health data can improve your trial experience by reducing manual data entry and providing
                  more comprehensive insights. All data is encrypted and used only for trial purposes.
                </p>

                <div className="rounded-lg border p-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="ehr-sharing"
                      checked={dataSharing.ehr}
                      onCheckedChange={(checked) => handleDataSharingChange("ehr", checked)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="ehr-sharing" className="text-base font-medium">
                        Electronic Health Records
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Connect your medical records to automatically import relevant health data and lab results.
                      </p>
                      {dataSharing.ehr && (
                        <div className="mt-3 space-y-3">
                          <div className="grid gap-2">
                            <Label htmlFor="ehr-provider">Select Your Healthcare Provider</Label>
                            <select
                              id="ehr-provider"
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <option value="">Select provider...</option>
                              <option value="epic">Epic MyChart</option>
                              <option value="cerner">Cerner</option>
                              <option value="allscripts">Allscripts</option>
                              <option value="nextgen">NextGen</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                          <Button size="sm">Connect EHR</Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="wearables-sharing"
                      checked={dataSharing.wearables}
                      onCheckedChange={(checked) => handleDataSharingChange("wearables", checked)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="wearables-sharing" className="text-base font-medium">
                        Wearable Devices
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Connect your wearable devices to automatically track activity, sleep, heart rate, and other
                        metrics.
                      </p>
                      {dataSharing.wearables && (
                        <div className="mt-3 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <Button size="sm" variant="outline" className="flex items-center justify-center gap-2">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M16.5 16.5 12 21l-4.5-4.5"></path>
                                <path d="M12 3v18"></path>
                              </svg>
                              Apple Health
                            </Button>
                            <Button size="sm" variant="outline" className="flex items-center justify-center gap-2">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <circle cx="12" cy="12" r="10"></circle>
                                <path d="m16.24 7.76-4.24 4.24-4.24-4.24"></path>
                              </svg>
                              Fitbit
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <Button size="sm" variant="outline" className="flex items-center justify-center gap-2">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"></path>
                                <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"></path>
                                <circle cx="12" cy="12" r="2"></circle>
                                <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"></path>
                                <path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"></path>
                              </svg>
                              Garmin
                            </Button>
                            <Button size="sm" variant="outline" className="flex items-center justify-center gap-2">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M12 2v20"></path>
                                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                              </svg>
                              Samsung Health
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="apps-sharing"
                      checked={dataSharing.healthApps}
                      onCheckedChange={(checked) => handleDataSharingChange("healthApps", checked)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="apps-sharing" className="text-base font-medium">
                        Health Apps
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Connect health apps you use to track specific conditions, symptoms, or medications.
                      </p>
                      {dataSharing.healthApps && (
                        <div className="mt-3 space-y-3">
                          <div className="grid gap-2">
                            <Label htmlFor="health-app">Select Health Apps</Label>
                            <select
                              id="health-app"
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <option value="">Select app...</option>
                              <option value="myfitness">MyFitnessPal</option>
                              <option value="glucose">Glucose Buddy</option>
                              <option value="medisafe">Medisafe</option>
                              <option value="clue">Clue</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                          <Button size="sm">Connect App</Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border p-4 bg-muted/50">
                  <div className="flex items-start gap-3">
                    <Lock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium">Privacy Protection</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Your data is encrypted and used only for this trial. You can revoke access at any time. See the
                        Decentralized FDA{" "}
                        <Link href="/privacy" className="text-primary underline">
                          privacy policy
                        </Link>{" "}
                        for details.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button onClick={handleNext}>Continue to Confirmation</Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 8: Confirmation */}
        {currentStep === 7 && (
          <Card>
            <CardHeader>
              <CardTitle>Enrollment Confirmation</CardTitle>
              <CardDescription>You're all set to begin your clinical trial</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="rounded-lg border-2 border-green-200 bg-green-50 p-6 text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-green-800 mb-2">Enrollment Complete!</h2>
                  <p className="text-green-700 mb-4">You have successfully enrolled in the {trial.title} trial.</p>
                  <div className="inline-flex items-center rounded-full bg-green-100 px-4 py-1 text-sm font-medium text-green-800">
                    Trial ID: FDA-{Math.floor(100000 + Math.random() * 900000)}
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <h3 className="font-medium mb-3">Next Steps</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                        1
                      </div>
                      <div>
                        <h4 className="font-medium">Complete Baseline Labs</h4>
                        <p className="text-sm text-muted-foreground">
                          Your lab kit will be shipped or you can visit your selected lab location.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                        2
                      </div>
                      <div>
                        <h4 className="font-medium">Receive Your Medication</h4>
                        <p className="text-sm text-muted-foreground">
                          Your medication will be delivered via your chosen method within 3-5 business days.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                        3
                      </div>
                      <div>
                        <h4 className="font-medium">Download the Trial App</h4>
                        <p className="text-sm text-muted-foreground">
                          Track your progress, report symptoms, and stay connected with the trial team.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                        4
                      </div>
                      <div>
                        <h4 className="font-medium">Begin Your Treatment</h4>
                        <p className="text-sm text-muted-foreground">
                          Follow the instructions provided with your medication to start your treatment.
                        </p>
                      </div>
                    </li>
                  </ul>
                </div>

                <div className="rounded-lg border p-4 bg-muted/50">
                  <div className="flex items-start gap-3">
                    <Smartphone className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium">Stay Connected</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        We've sent a confirmation email with all these details and next steps. You can also access your
                        trial information anytime in your patient dashboard.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button asChild>
                <Link href="/patient/dashboard">Go to Dashboard</Link>
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  )
}


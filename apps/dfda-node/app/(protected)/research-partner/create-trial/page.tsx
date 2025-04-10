"use client"

import { useState } from "react"
import Link from "next/link"
// Update the import for Check icon
import { ArrowLeft } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Step1TrialDetails } from "./components/step-1-trial-details"
import { Step2Insurance } from "./components/step-2-insurance"
import { Step3Parameters } from "./components/step-3-parameters"
import { Step4Review } from "./components/step-4-review"
import { StepIndicator } from "./components/step-indicator"

// Update the page component to handle step clicks
export default function CreateTrial() {
  const [step, setStep] = useState(1)

  const nextStep = () => setStep(step + 1)
  const prevStep = () => setStep(step - 1)
  const goToStep = (stepNumber: number) => setStep(stepNumber)

  const steps = [
    { number: 1, label: "Trial Details" },
    { number: 2, label: "Insurance" },
    { number: 3, label: "Parameters" },
    { number: 4, label: "Review & Submit" },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 py-6 md:py-10">
        <div className="container">
          <div className="mx-auto max-w-4xl">
            <div className="mb-8 flex items-center gap-2">
              <Link href="/app/(protected)/research-partner/dashboard" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
              </Link>
              <h1 className="text-2xl font-bold">Create a Decentralized Clinical Trial</h1>
            </div>

            <StepIndicator currentStep={step} steps={steps} onStepClick={goToStep} />

            <Card>
              {step === 1 && <Step1TrialDetails nextStep={nextStep} />}
              {step === 2 && <Step2Insurance nextStep={nextStep} prevStep={prevStep} />}
              {step === 3 && <Step3Parameters nextStep={nextStep} prevStep={prevStep} />}
              {step === 4 && <Step4Review prevStep={prevStep} />}
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}


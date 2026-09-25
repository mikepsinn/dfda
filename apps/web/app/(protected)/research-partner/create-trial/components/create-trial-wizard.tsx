"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Step1TrialDetails } from "./step-1-trial-details"
import { Step2Insurance } from "./step-2-insurance"
import { Step3Parameters } from "./step-3-parameters"
import { Step4Review } from "./step-4-review"
import { StepIndicator } from "./step-indicator"

export function CreateTrialWizard() {
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
    <>
      <StepIndicator currentStep={step} steps={steps} onStepClick={goToStep} />
      <Card>
        {step === 1 && <Step1TrialDetails nextStep={nextStep} />}
        {step === 2 && <Step2Insurance nextStep={nextStep} prevStep={prevStep} />}
        {step === 3 && <Step3Parameters nextStep={nextStep} prevStep={prevStep} />}
        {step === 4 && <Step4Review prevStep={prevStep} />}
      </Card>
    </>
  )
} 
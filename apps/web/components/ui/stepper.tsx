"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button, type ButtonProps } from "@/components/ui/button"

// Stepper Context
interface StepperContextValue extends StepperProps {
  activeStep: number
  setActiveStep: React.Dispatch<React.SetStateAction<number>>
  nextStep: () => void
  prevStep: () => void
  resetSteps: () => void
  isDisabledStep: boolean
  isLastStep: boolean
  isOptionalStep: boolean
}

const StepperContext = React.createContext<StepperContextValue | null>(null)

export function useStepper() {
  const context = React.useContext(StepperContext)
  if (!context) {
    throw new Error("useStepper must be used within a Stepper component")
  }
  return context
}

// Stepper Component
interface StepperProps extends React.HTMLAttributes<HTMLDivElement> {
  initialStep?: number
  steps: { label?: string; description?: string; optional?: boolean }[]
}

export function Stepper({
  initialStep = 0,
  steps,
  children,
  className,
  ...props
}: StepperProps) {
  const [activeStep, setActiveStep] = React.useState(initialStep)

  const nextStep = () => {
    setActiveStep((prev) => Math.min(prev + 1, steps.length - 1))
  }

  const prevStep = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0))
  }

  const resetSteps = () => {
    setActiveStep(initialStep)
  }

  const isLastStep = activeStep === steps.length - 1
  const isDisabledStep = activeStep === steps.length // Or any other logic for disabling
  const isOptionalStep = !!steps[activeStep]?.optional

  const contextValue: StepperContextValue = {
    activeStep,
    setActiveStep,
    nextStep,
    prevStep,
    resetSteps,
    steps,
    initialStep,
    isDisabledStep,
    isLastStep,
    isOptionalStep,
  }

  return (
    <StepperContext.Provider value={contextValue}>
      <div className={cn("flex w-full flex-col gap-6", className)} {...props}>
        {children}
      </div>
    </StepperContext.Provider>
  )
}

// Step Component (Basic visual representation)
interface StepProps extends React.HTMLAttributes<HTMLDivElement> {
  stepIndex: number
  isCompletedStep?: boolean
  isCurrentStep?: boolean
}

export function Step({
  stepIndex,
  isCompletedStep,
  isCurrentStep,
  className,
  children,
  ...props
}: StepProps) {
  const { activeStep, steps } = useStepper()
  const isCompleted = isCompletedStep ?? stepIndex < activeStep
  const isCurrent = isCurrentStep ?? stepIndex === activeStep

  return (
    <div
      className={cn(
        "flex items-center gap-3",
        isCompleted ? "text-primary" : isCurrent ? "text-foreground font-semibold" : "text-muted-foreground",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "flex h-6 w-6 items-center justify-center rounded-full border text-xs",
          isCompleted ? "border-primary bg-primary text-primary-foreground" : isCurrent ? "border-primary" : "border-muted-foreground"
        )}
      >
        {isCompleted ? "✔" : stepIndex + 1}
      </div>
      <div>
        {steps[stepIndex]?.label && <div className="text-sm">{steps[stepIndex].label}</div>}
        {steps[stepIndex]?.description && <div className="text-xs text-muted-foreground">{steps[stepIndex].description}</div>}
      </div>
      {children}
    </div>
  )
}

// Stepper Navigation Buttons
export function StepButton({ variant = "ghost", ...props }: ButtonProps) {
  return <Button variant={variant} {...props} />
}

export function StepNext({ children = "Next", ...props }: ButtonProps) {
  const { nextStep, isLastStep } = useStepper()
  return (
    <Button onClick={nextStep} disabled={isLastStep} {...props}>
      {children}
    </Button>
  )
}

export function StepPrevious({ children = "Back", ...props }: ButtonProps) {
  const { prevStep, activeStep } = useStepper()
  return (
    <Button variant="outline" onClick={prevStep} disabled={activeStep === 0} {...props}>
      {children}
    </Button>
  )
} 
"use client"

import { Check } from "lucide-react"

interface StepIndicatorProps {
  currentStep: number
  steps: Array<{
    number: number
    label: string
  }>
  onStepClick: (stepNumber: number) => void
}

export function StepIndicator({ currentStep, steps, onStepClick }: StepIndicatorProps) {
  return (
    <div className="flex justify-center px-6 mb-8">
      <div className="grid grid-cols-4 gap-4 w-full max-w-3xl">
        {steps.map((step, index) => (
          <div
            key={index}
            className="flex flex-col items-center cursor-pointer"
            onClick={() => onStepClick(step.number)}
          >
            <div className="flex items-center justify-center relative w-full">
              {index > 0 && (
                <div
                  className={`absolute h-0.5 w-full left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 ${currentStep > index ? "bg-primary" : "bg-muted"}`}
                ></div>
              )}
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  currentStep >= step.number ? "bg-primary text-primary-foreground" : "border bg-muted"
                } mb-2 hover:opacity-80 transition-opacity z-10`}
              >
                {currentStep > step.number ? <Check className="h-5 w-5" /> : step.number}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`absolute h-0.5 w-full right-0 top-1/2 -translate-y-1/2 translate-x-1/2 ${currentStep > index + 1 ? "bg-primary" : "bg-muted"}`}
                ></div>
              )}
            </div>
            <div className="text-center text-sm hover:text-primary transition-colors">{step.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}


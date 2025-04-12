import { ClipboardCheck } from "lucide-react"
import { HowItWorksStep } from "../HowItWorksStep"

export function Step3JoinTrial() {
  return (
    <HowItWorksStep
      stepNumber={3}
      title="Join a Trial"
      icon={<ClipboardCheck className="h-5 w-5 text-primary" />}
      description="Complete informed consent and enroll in your chosen trial."
      benefits={[
        "Simple digital enrollment process",
        "Clear explanation of trial requirements",
        "Transparent compensation information",
        "Easy withdrawal option if needed",
      ]}
      preview={
        <div className="bg-background rounded-lg border shadow-lg p-4 w-full max-w-md">
          <div className="space-y-4">
            <div className="font-bold">Informed Consent</div>
            <div className="space-y-3">
              <div className="text-sm">
                I understand that I am enrolling in a clinical trial for a new Alzheimer's disease treatment.
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded border flex items-center justify-center">
                  <div className="h-2 w-2 bg-primary rounded-sm"></div>
                </div>
                <div className="text-sm">I have reviewed the outcome label</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded border flex items-center justify-center">
                  <div className="h-2 w-2 bg-primary rounded-sm"></div>
                </div>
                <div className="text-sm">I understand the potential risks</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded border flex items-center justify-center">
                  <div className="h-2 w-2 bg-primary rounded-sm"></div>
                </div>
                <div className="text-sm">I agree to share my anonymized data</div>
              </div>
              <div className="mt-4">
                <div className="bg-primary text-primary-foreground rounded px-3 py-2 text-sm text-center">
                  Complete Enrollment
                </div>
              </div>
            </div>
          </div>
        </div>
      }
      reverse={false}
    />
  )
}


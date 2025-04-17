import { FileText } from "lucide-react"
import { HowItWorksStep } from "../HowItWorksStep"
import { OutcomeLabel } from "@/components/OutcomeLabel"

export function Step2ViewOutcomeLabels() {
  return (
    <HowItWorksStep
      stepNumber={2}
      title="View Outcome Labels"
      icon={<FileText className="h-5 w-5 text-primary" />}
      description="Review comprehensive outcome data before deciding to join a trial."
      benefits={[
        "See real effectiveness data from actual patients",
        "Understand potential side effects and their frequency",
        "Compare with standard of care treatments",
        "Read about experiences from patients like you",
      ]}
      preview={
        <OutcomeLabel
          title="Klotho-Increasing Gene Therapy"
          outcomeData={[
            { name: "Cognitive Function (ADAS-Cog)", value: 28, positive: true },
            { name: "Memory Recall", value: 35, positive: true },
            { name: "Executive Function", value: 22, positive: true },
            { name: "Hippocampal Volume", value: 15, positive: true },
          ]}
          sideEffectsData={[
            { name: "Immune Response", value: 12 },
            { name: "Headache", value: 9 },
            { name: "Fatigue", value: 7 },
          ]}
        />
      }
      reverse={true}
    />
  )
}


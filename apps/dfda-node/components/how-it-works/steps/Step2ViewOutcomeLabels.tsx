import { FileText } from "lucide-react"
import { HowItWorksStep } from "../HowItWorksStep"
import { OutcomeLabel } from "@/components/OutcomeLabel"

// Convert the old data structure to the new format expected by OutcomeLabel
const klothoGeneTherapyData = {
  title: "Klotho-Increasing Gene Therapy",
  // No subtitle or tag needed for this example
  data: [
    {
      title: "Cognitive Improvements", // Provide a category title
      items: [
        { name: "Cognitive Function (ADAS-Cog)", value: { percentage: 28 }, isPositive: true },
        { name: "Memory Recall", value: { percentage: 35 }, isPositive: true },
        { name: "Executive Function", value: { percentage: 22 }, isPositive: true },
        { name: "Hippocampal Volume", value: { percentage: 15 }, isPositive: true },
      ],
    },
    {
      title: "Side Effects", // Provide a category title
      isSideEffectCategory: true,
      items: [
        { name: "Immune Response", value: { percentage: 12 }, isPositive: false }, // Assuming side effect percentages are increases to show
        { name: "Headache", value: { percentage: 9 }, isPositive: false },
        { name: "Fatigue", value: { percentage: 7 }, isPositive: false },
      ],
    },
  ],
  // No footer needed for this example
};

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
        // Use the new data structure
        <OutcomeLabel {...klothoGeneTherapyData} />
      }
      reverse={true}
    />
  )
}


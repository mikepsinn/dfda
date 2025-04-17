import Link from "next/link"
import { Button } from "@/components/ui/button"
import { OutcomeLabel } from "./OutcomeLabel"

// Define the sample data according to the new OutcomeLabelProps interface
const atorvastatinData = {
  title: "Atorvastatin 20mg daily",
  tag: "Lipid-lowering agent",
  data: [
    {
      title: "Primary Outcomes",
      items: [
        {
          name: "LDL Cholesterol",
          baseline: "(baseline: 160 mg/dL)",
          value: { percentage: -43, absolute: "-69 mg/dL" },
          isPositive: true,
        },
        {
          name: "Total Cholesterol",
          baseline: "(baseline: 240 mg/dL)",
          value: { percentage: -32, absolute: "-77 mg/dL" },
          isPositive: true,
        },
        {
          name: "Cardiovascular Event Risk",
          baseline: "(10-year risk)",
          value: { percentage: -36, absolute: "-4.2%" },
          isPositive: true,
        },
      ],
    },
    {
      title: "Secondary Benefits",
      items: [
        {
          name: "HDL Cholesterol",
          value: { percentage: 5, absolute: "+2.3 mg/dL" },
          isPositive: true,
        },
        {
          name: "Triglycerides",
          value: { percentage: -22, absolute: "-35 mg/dL" },
          isPositive: true,
        },
      ],
    },
    {
      title: "Side Effects",
      isSideEffectCategory: true,
      items: [
        {
          name: "Muscle Pain/Weakness",
          baseline: "(vs. placebo)",
          value: { percentage: 8.2, nnh: 12 }, // Percentage treated as positive increase for side effects
          isPositive: false, // Explicitly false for red text/bar
        },
        {
          name: "Liver Enzyme Elevation",
          value: { percentage: 1.2, nnh: 83 },
          isPositive: false,
        },
        {
          name: "Headache",
          value: { percentage: 3.8, nnh: 26 },
          isPositive: false,
        },
      ],
    },
  ],
  footer: {
    sourceDescription: "Based on 42 clinical trials with 48,500 participants",
    lastUpdated: "Last updated: Feb 2025",
    nnhDescription: "NNH = Number Needed to Harm (patients treated for one additional adverse event)",
  },
};

export function OutcomeLabelsSection() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
      <div className="container px-4 md:px-6">
        <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-2 lg:gap-12">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Outcome Labels</h2>
            <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed">
              See the quantitative effects of foods and drugs on all measurable aspects of human health
            </p>
            <ul className="grid gap-2">
              <li className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5 text-primary"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Comprehensive health impact data</span>
              </li>
              <li className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5 text-primary"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Both positive and negative effects</span>
              </li>
              <li className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5 text-primary"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Evidence-based decision making</span>
              </li>
            </ul>
            <Link href="/outcome-labels">
              <Button variant="outline">Learn More</Button>
            </Link>
          </div>
          <OutcomeLabel {...atorvastatinData} />
        </div>
      </div>
    </section>
  )
}


import Link from "next/link"
import { Check, FlaskConical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { OutcomeLabel } from "./OutcomeLabel"
import { treatmentOutcomeCategories } from "./demo/treatment-outcomes"
import type { LandingOutcomeLabel } from "@/lib/demo/landing-preview"

const features = [
  "Comprehensive health impact data",
  "Both positive and negative effects",
  "Evidence-based decision making",
]

export function OutcomeLabelsSection({ example }: { example: LandingOutcomeLabel | null }) {
  return (
    <section className="band-muted w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-2 lg:gap-12">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Outcome Labels</h2>
            <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed">
              See the quantitative effects of foods and drugs on all measurable aspects of human health
            </p>
            <ul className="grid gap-2">
              {features.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <Check aria-hidden="true" className="h-5 w-5 shrink-0 text-primary" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Button asChild variant="outline">
              <Link href={example?.href ?? "/treatment-rankings"}>
                {example ? "View the full Outcome Label" : "Compare treatments"}
              </Link>
            </Button>
          </div>
          {example && (
            <div className="space-y-3">
              <OutcomeLabel title={example.treatment.name} tag={example.conditionName}
                subtitle="Current best estimates. Changes are relative to the baselines shown."
                data={treatmentOutcomeCategories(example.treatment)} showBars={false} />
              {example.trialNctId && (
                <Link href={`${example.href}#trial-results`}
                  className="inline-flex items-center gap-2 rounded-sm text-sm font-medium text-primary hover:underline">
                  <FlaskConical aria-hidden="true" className="h-4 w-4 shrink-0" />
                  Also includes a posted trial result ({example.trialNctId})
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

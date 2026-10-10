import type { TrialComparison } from "@/lib/evidence/clinical-trial-comparison";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TrialResult({ comparison }: { comparison: TrialComparison }) {
  const { effect, treatment, control } = comparison;
  return (
    <section id="trial-results" aria-labelledby="trial-result-heading"
      className="scroll-mt-24 space-y-4 rounded-xl border border-primary/30 bg-card p-5 sm:p-6">
      <div>
        <h2 id="trial-result-heading" className="text-xl font-semibold">Reported trial result</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          One randomized, double-blind trial · Secondary endpoint · Month 3
        </p>
      </div>
      <p className="text-2xl font-semibold">
        {Math.abs(effect.value)} {effect.value >= 0 ? "more" : "fewer"} minutes of sleep vs placebo
      </p>
      <p className="text-sm">
        Adjusted difference in change from baseline in diary-reported nightly sleep
        time (days 76–90). 95% confidence interval: {effect.lower} to {effect.upper} minutes.
      </p>
      <dl className="grid grid-cols-1 gap-4 rounded-lg bg-muted/50 p-4 sm:grid-cols-2">
        {[treatment, control].map(arm => (
          <div key={arm.name}>
            <dt className="font-medium">{arm.name}</dt>
            <dd>
              {arm.adjustedChange > 0 ? "+" : ""}{arm.adjustedChange} minutes from baseline
              <span className="block text-sm text-muted-foreground">
                {arm.participants} participants analyzed
              </span>
            </dd>
          </div>
        ))}
      </dl>
      <p className="text-sm text-muted-foreground">
        Trial regimen: suvorexant 20 mg for ages 18–64 or 15 mg for ages 65+, nightly.
        Both groups followed a two-week placebo run-in. The comparison above is the
        study’s reported adjusted result.
      </p>
      <details className="text-sm">
        <summary className="cursor-pointer font-medium">Outcome and analysis details</summary>
        <div className="mt-3 space-y-3 text-muted-foreground">
          <p>{comparison.outcomeDescription}</p>
          <p>{comparison.populationDescription}</p>
          <p>{effect.method}. {effect.adjustments}</p>
          <p>{effect.testingNotes}</p>
          <p>Group values are adjusted mean changes; rounding can differ from the reported comparison.</p>
        </div>
      </details>
      <Button asChild variant="outline" className="h-auto min-h-10 gap-2 whitespace-normal">
        <a href={comparison.resultsUrl} target="_blank" rel="noopener noreferrer">
          View posted results · {comparison.nctId} <ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0" />
        </a>
      </Button>
    </section>
  );
}

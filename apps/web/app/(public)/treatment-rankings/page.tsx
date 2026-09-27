import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, FlaskConical, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { ConditionPicker } from "@/components/demo/condition-picker";
import { EstimateNotice } from "@/components/demo/estimate-notice";
import { TreatmentScores } from "@/components/demo/treatment-scores";
import { formatEstimatedCost } from "@/lib/demo/format-estimate";
import { getTrialComparisons } from "@/lib/evidence/trial-comparisons";
import { outcomeLabelHref, rankTreatments, conditionCatalog, getConditionEstimate } from "@/lib/demo/treatment-estimates";

export const metadata: Metadata = {
  title: "Treatment Rankings Demo | dFDA",
  description: "Compare treatment estimates, explore benefits and side effects, and find related trials.",
};

export default async function TreatmentRankingsPage({ searchParams }: {
  searchParams: Promise<{ condition?: string; sort?: string }>;
}) {
  const query = await searchParams;
  const condition = await getConditionEstimate(query.condition ?? "depression");
  const sort = query.sort === "safety" ? "safety" : "effectiveness";
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="space-y-4 rounded-2xl bg-gradient-to-br from-primary/5 to-muted/50 p-6 sm:p-8">
        <p className="inline-flex items-center gap-2 rounded-full bg-background px-3 py-1 text-sm font-medium text-primary">
          <SlidersHorizontal aria-hidden="true" className="h-4 w-4" /> Explore treatments
        </p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Treatment rankings</h1>
        <p className="max-w-2xl text-muted-foreground sm:text-lg">
          See how treatments compare. Explore benefits, side effects and costs,
          then explore related studies.
        </p>
      </header>
      <form action="/treatment-rankings" method="get"
        className="grid items-end gap-4 rounded-xl border bg-card p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
        <ConditionPicker key={condition?.slug ?? "unknown"} initialValue={condition?.slug ?? ""}
          conditions={conditionCatalog.map(({ slug, name, synonyms }) => ({ slug, name, synonyms }))} />
        <div className="space-y-2">
          <label htmlFor="sort" className="block text-sm font-medium">Rank by</label>
          <select id="sort" name="sort" defaultValue={sort} key={sort}
            className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <option value="effectiveness">Estimated effectiveness</option>
            <option value="safety">Estimated safety</option>
          </select>
        </div>
        <Button type="submit" size="lg" className="gap-2 sm:col-span-2 lg:col-span-1">
          Compare treatments <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Button>
      </form>
      <EstimateNotice />
      {condition ? (
        <section aria-labelledby="ranking-heading" className="space-y-5">
          <div className="space-y-2">
            <h2 id="ranking-heading" className="text-2xl font-semibold tracking-tight">
              {condition.name}: {condition.treatments.length} treatment estimates
            </h2>
            <p className="max-w-3xl text-sm text-muted-foreground">
              Sorted by {sort} score, highest first; ties use alphabetical order.
              Scores use a 0–100 scale, not response percentages.
            </p>
          </div>
          <ol className="grid gap-5 md:grid-cols-2">
            {rankTreatments(condition.treatments, sort).map((treatment, index) => {
              const href = outcomeLabelHref(condition.slug, treatment.slug);
              return (
                <li key={treatment.slug} className="min-w-0">
                  <Card className="flex h-full flex-col transition-shadow hover:shadow-md">
                    <CardHeader className="flex-row items-start gap-3 space-y-0 md:min-h-[100px]">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary"
                        aria-label={`Rank ${index + 1} by estimated ${sort}`}>{index + 1}</span>
                      <h3 className="pt-1 text-lg font-semibold leading-snug">
                        <Link className="rounded-sm transition-colors hover:text-primary focus-visible:outline-primary" href={href}>{treatment.name}</Link>
                      </h3>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-5">
                      <TreatmentScores effectiveness={treatment.effectiveness} safetyScore={treatment.safetyScore} />
                      <dl className="grid grid-cols-2 gap-4 border-t pt-4 text-sm">
                        <div><dt className="text-muted-foreground">Annual cost estimate</dt><dd className="mt-1 font-medium tabular-nums">{formatEstimatedCost(treatment.healthEconomics?.annualCostOfCare?.totalAnnual)} <span className="font-normal text-muted-foreground">USD</span></dd></div>
                        <div><dt className="text-muted-foreground">Time to effect</dt><dd className="mt-1 font-medium">{treatment.timeToEffect || "Not available"}</dd></div>
                      </dl>
                    </CardContent>
                    <CardFooter className="flex-col items-stretch gap-2">
                      <Button asChild variant="outline" className="justify-between gap-2">
                        <Link href={href}>View Outcome Label <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
                      </Button>
                      {getTrialComparisons(condition.slug, treatment.slug).length > 0 && (
                        <Button asChild variant="ghost" size="sm" className="h-auto min-h-10 gap-2 whitespace-normal text-primary">
                          <Link href={`${href}#trial-results`}><FlaskConical aria-hidden="true" className="h-4 w-4 shrink-0" /> Posted trial comparison available</Link>
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                </li>
              );
            })}
          </ol>
        </section>
      ) : (
        <p role="status" className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
          No imported estimates for that condition. Choose one of the available conditions above.
        </p>
      )}
      <div className="flex flex-col items-start justify-between gap-4 rounded-xl bg-muted/50 p-6 sm:flex-row sm:items-center">
        <div><h2 className="font-semibold">Ready to explore the research?</h2><p className="mt-1 text-sm text-muted-foreground">Browse study details, eligibility and contact information.</p></div>
        <Button asChild variant="outline" className="gap-2"><Link href="/conditions">Find clinical trials <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link></Button>
      </div>
    </div>
  );
}

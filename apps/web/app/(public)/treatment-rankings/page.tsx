import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConditionPicker } from "@/components/demo/condition-picker";
import { EstimateNotice } from "@/components/demo/estimate-notice";
import { TreatmentRankingCard } from "@/components/demo/treatment-ranking-card";
import { rankTreatments, conditionCatalog, getConditionEstimate } from "@/lib/demo/treatment-estimates";

export const metadata: Metadata = {
  title: "Treatment Rankings Demo | Open Treatment Evidence Network",
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
            {rankTreatments(condition.treatments, sort).map((treatment, index) => (
              <li key={treatment.slug} className="min-w-0">
                <TreatmentRankingCard conditionSlug={condition.slug} treatment={treatment} rank={index + 1} sort={sort} />
              </li>
            ))}
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

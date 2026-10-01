import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ArrowUpRight, ClipboardList, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EstimateNotice } from "@/components/demo/estimate-notice";
import { TrialResult } from "@/components/demo/trial-result";
import { TreatmentScores } from "@/components/demo/treatment-scores";
import { TreatmentOutcomes } from "@/components/demo/treatment-outcomes";
import { HealthEconomics } from "@/components/demo/health-economics";
import { getTrialComparisons } from "@/lib/evidence/trial-comparisons";
import { getConditionEstimate } from "@/lib/demo/treatment-estimates";

type Props = { params: Promise<{ conditionSlug: string; treatmentSlug: string }> };

async function lookup(params: Props["params"]) {
  const { conditionSlug, treatmentSlug } = await params;
  const condition = await getConditionEstimate(conditionSlug);
  const treatment = condition?.treatments.find(item => item.slug === treatmentSlug);
  if (!condition || !treatment) notFound();
  return { condition, treatment };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { condition, treatment } = await lookup(params);
  return { title: `${treatment.name} for ${condition.name}: Outcome Label | Open Treatment Evidence Network` };
}

export default async function DemoOutcomeLabel({ params }: Props) {
  const { condition, treatment } = await lookup(params);
  const comparisons = getTrialComparisons(condition.slug, treatment.slug);
  const trials = `https://clinicaltrials.gov/search?cond=${encodeURIComponent(condition.name)}&intr=${encodeURIComponent(treatment.name)}`;
  return (
    <article className="mx-auto max-w-5xl space-y-8">
      <Button asChild variant="ghost" className="h-auto min-h-10 max-w-full gap-2 whitespace-normal text-left">
        <Link href={`/treatment-rankings?condition=${condition.slug}`}>
          <ArrowLeft aria-hidden="true" className="h-4 w-4 shrink-0" /> {condition.name} treatment rankings
        </Link>
      </Button>
      <header className="rounded-2xl bg-gradient-to-br from-primary/5 to-muted/50 p-6 sm:p-8">
        <p className="inline-flex items-center gap-2 rounded-full bg-background px-3 py-1 text-sm font-medium text-primary">
          <ClipboardList aria-hidden="true" className="h-4 w-4" /> Outcome Label
        </p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{treatment.name}</h1>
        <p className="mt-2 text-lg text-muted-foreground">For {condition.name}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild className="gap-2"><a href={trials} target="_blank" rel="noopener noreferrer">
            Search ClinicalTrials.gov <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
          </a></Button>
          {comparisons.length > 0 && <Button asChild variant="outline" className="gap-2">
            <a href="#trial-results"><FlaskConical aria-hidden="true" className="h-4 w-4" /> View trial result</a>
          </Button>}
        </div>
      </header>
      <EstimateNotice />
      <Card>
        <CardContent className="space-y-4 p-5 sm:p-6">
          <TreatmentScores effectiveness={treatment.effectiveness} safetyScore={treatment.safetyScore} />
          <p className="text-xs text-muted-foreground">Scores use a 0–100 scale, not a response percentage.</p>
        </CardContent>
      </Card>
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <TreatmentOutcomes treatment={treatment} />
        <div className="space-y-6">
          <HealthEconomics economics={treatment.healthEconomics} />
          <Card>
            <CardHeader className="pb-4"><h2 className="text-lg font-semibold">Snapshot regimen</h2></CardHeader>
            <CardContent className="space-y-4 text-sm">
              <dl className="space-y-4">
                <div><dt className="text-muted-foreground">Dose / schedule</dt><dd className="mt-1 font-medium">{treatment.dosageRange || "Not provided"}</dd></div>
                <div><dt className="text-muted-foreground">Time to effect</dt><dd className="mt-1 font-medium">{treatment.timeToEffect || "Not provided"}</dd></div>
                <div><dt className="text-muted-foreground">Treatment duration</dt><dd className="mt-1 font-medium">{treatment.treatmentDuration || "Not provided"}</dd></div>
              </dl>
              <p className="border-t pt-4 text-xs text-muted-foreground">Describes the estimate; not a dosing recommendation.</p>
            </CardContent>
          </Card>
        </div>
      </div>
      {comparisons.map(comparison => <TrialResult key={comparison.nctId} comparison={comparison} />)}
    </article>
  );
}

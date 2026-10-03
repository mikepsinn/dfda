import Link from "next/link";
import { ArrowRight, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { TreatmentScores } from "@/components/demo/treatment-scores";
import { formatEstimatedCost } from "@/lib/demo/format-estimate";
import { getTrialComparisons } from "@/lib/evidence/trial-comparisons";
import { outcomeLabelHref, type TreatmentEstimate } from "@/lib/demo/treatment-estimates";

// One treatment in a condition's ranking, as on /treatment-rankings and in presentations.
export function TreatmentRankingCard({ conditionSlug, treatment, rank, sort }: {
  conditionSlug: string;
  treatment: TreatmentEstimate;
  rank: number;
  sort: "effectiveness" | "safety";
}) {
  const href = outcomeLabelHref(conditionSlug, treatment.slug);
  return (
    <Card className="flex h-full flex-col transition-shadow hover:shadow-md">
      <CardHeader className="flex-row items-start gap-3 space-y-0 md:min-h-[100px]">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary"
          aria-label={`Rank ${rank} by estimated ${sort}`}>{rank}</span>
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
        {getTrialComparisons(conditionSlug, treatment.slug).length > 0 && (
          <Button asChild variant="ghost" size="sm" className="h-auto min-h-10 gap-2 whitespace-normal text-primary">
            <Link href={`${href}#trial-results`}><FlaskConical aria-hidden="true" className="h-4 w-4 shrink-0" /> Posted trial comparison available</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

import { Wallet } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatEstimatedCost } from "@/lib/demo/format-estimate";
import type { TreatmentEstimate } from "@/lib/demo/treatment-estimates";

export function HealthEconomics({ economics }: { economics: TreatmentEstimate["healthEconomics"] }) {
  const annual = economics?.annualCostOfCare;
  const comparator = economics?.vsComparator;
  return (
    <Card>
      <CardHeader className="space-y-3 pb-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Wallet aria-hidden="true" className="h-5 w-5 text-primary" /> Cost estimates
        </h2>
        <div>
          <p className="text-3xl font-semibold tabular-nums tracking-tight">{formatEstimatedCost(annual?.totalAnnual)}</p>
          <p className="mt-1 text-sm text-muted-foreground">Estimated annual cost · USD</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {annual && (
          <dl className="space-y-3 border-t pt-4">
            {[
              { label: "Treatment", value: annual.drugCost },
              { label: "Monitoring", value: annual.monitoringCost },
              { label: "Side-effect management", value: annual.sideEffectManagement },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between gap-3">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="shrink-0 font-medium tabular-nums">{formatEstimatedCost(value)}</dd>
              </div>
            ))}
          </dl>
        )}
        {economics && (
          <details className="border-t pt-4">
            <summary className="cursor-pointer font-medium focus-visible:outline-primary">Cost-effectiveness details</summary>
            <dl className="mt-4 space-y-3">
              <div><dt className="text-muted-foreground">Cost per responder</dt><dd>{formatEstimatedCost(economics.costPerResponder)}</dd></div>
              <div><dt className="text-muted-foreground">Cost per remission</dt><dd>{formatEstimatedCost(economics.costPerRemission)}</dd></div>
              {comparator?.comparatorName && (
                <>
                  <div><dt className="text-muted-foreground">Compared with</dt><dd>{comparator.comparatorName}</dd></div>
                  <div><dt className="text-muted-foreground">Cost difference</dt><dd>{formatEstimatedCost(comparator.costDifference)}</dd></div>
                  <div><dt className="text-muted-foreground">Incremental cost per quality-adjusted life-year (ICER)</dt><dd>{formatEstimatedCost(economics.icer)}</dd></div>
                </>
              )}
            </dl>
          </details>
        )}
        <p className="text-xs text-muted-foreground">Snapshot estimates, not current price quotes.</p>
      </CardContent>
    </Card>
  );
}

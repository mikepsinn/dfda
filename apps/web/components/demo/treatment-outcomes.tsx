import { OutcomeLabel, type OutcomeCategory } from "@/components/OutcomeLabel";
import type { TreatmentEstimate } from "@/lib/demo/treatment-estimates";

export function TreatmentOutcomes({ treatment }: { treatment: TreatmentEstimate }) {
  const outcomes = (items: TreatmentEstimate["primaryOutcomes"]) => items.map(item => ({
    name: item.name,
    baseline: item.baseline ? `Baseline: ${item.baseline}` : "Baseline: Not provided",
    value: { percentage: item.percentageChange, absolute: item.absoluteChange ?? undefined },
    isPositive: item.isPositive,
  }));
  const data: OutcomeCategory[] = [
    { title: "Primary outcome estimates", items: outcomes(treatment.primaryOutcomes) },
    { title: "Other outcome estimates", items: outcomes(treatment.secondaryOutcomes) },
    {
      title: "Side-effect estimates", isSideEffectCategory: true,
      description: "Estimated frequency.",
      emptyText: "No side-effect estimates supplied; this does not establish safety.",
      items: treatment.sideEffects.map(item => ({ name: item.name, value: { percentage: item.percentage, kind: "frequency" } })),
    },
  ];
  return (
    <section aria-labelledby="outcome-estimates-heading">
      <h2 id="outcome-estimates-heading" className="mb-4 text-xl font-semibold">Benefits & side effects</h2>
      <OutcomeLabel title={treatment.name} subtitle="Estimated outcome changes relative to the baselines shown."
        data={data} showBars={false} className="max-w-none p-5 sm:p-6" />
    </section>
  );
}

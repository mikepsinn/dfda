import { OutcomeLabel, type OutcomeCategory } from "@/components/OutcomeLabel";
import { citedSource, type TreatmentEstimate } from "@/lib/demo/treatment-estimates";

export function treatmentOutcomeCategories(treatment: TreatmentEstimate): OutcomeCategory[] {
  const outcomes = (items: TreatmentEstimate["primaryOutcomes"]) => items.map(item => ({
    name: item.name,
    baseline: item.baseline ? `Baseline: ${item.baseline}` : "Baseline: Not provided",
    value: { percentage: item.percentageChange, absolute: item.absoluteChange ?? undefined },
    isPositive: item.isPositive,
    source: citedSource(item) ?? undefined,
  }));
  const sideEffects = treatment.sideEffects.map(item => ({
    name: item.name, value: { percentage: item.percentage, kind: "frequency" as const },
    source: citedSource(item) ?? undefined,
  }));
  return [
    { title: "Primary outcome estimates", items: outcomes(treatment.primaryOutcomes) },
    { title: "Other outcome estimates", items: outcomes(treatment.secondaryOutcomes) },
    {
      title: "Side-effect estimates", isSideEffectCategory: true,
      description: sideEffects.some(item => item.source)
        ? "Frequency, from the cited source where one is shown."
        : "Estimated frequency.",
      emptyText: "No side-effect estimates supplied; this does not establish safety.",
      items: sideEffects,
    },
  ];
}

// Whether any value on this treatment's label is taken from a cited source rather than estimated.
export function hasCitedValues(treatment: TreatmentEstimate) {
  return treatmentOutcomeCategories(treatment).some(category => category.items.some(item => item.source));
}

export function TreatmentOutcomes({ treatment }: { treatment: TreatmentEstimate }) {
  return (
    <section aria-labelledby="outcome-estimates-heading">
      <h2 id="outcome-estimates-heading" className="mb-4 text-xl font-semibold">Benefits & side effects</h2>
      <OutcomeLabel title={treatment.name} subtitle="Estimated changes with treatment. Each row's detail says what the change is compared with."
        data={treatmentOutcomeCategories(treatment)} showBars={false} className="max-w-none p-5 sm:p-6" />
    </section>
  );
}

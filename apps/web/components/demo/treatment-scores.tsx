export function TreatmentScores({ effectiveness, safetyScore }: {
  effectiveness: number;
  safetyScore: number;
}) {
  return (
    <dl className="grid grid-cols-2 gap-6">
      {[
        { label: "Effectiveness estimate", value: effectiveness },
        { label: "Safety estimate", value: safetyScore },
      ].map(metric => (
        <div key={metric.label}>
          <dt className="min-h-10 text-sm text-muted-foreground sm:min-h-0">{metric.label}</dt>
          <dd className="mt-1 text-3xl font-semibold tabular-nums tracking-tight">
            {metric.value}<span className="ml-1 text-sm font-normal text-muted-foreground">/ 100</span>
          </dd>
          <div aria-hidden="true" className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${metric.value}%` }} />
          </div>
        </div>
      ))}
    </dl>
  );
}

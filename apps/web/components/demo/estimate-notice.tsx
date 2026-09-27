import { estimateLabel } from "@/lib/demo/treatment-estimates";

export function EstimateNotice() {
  return (
    <aside className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-primary/5 px-4 py-3 text-sm">
      <p className="font-semibold text-primary">{estimateLabel}</p>
      <p className="text-muted-foreground">
        Preliminary estimates, updated as better evidence becomes available.
      </p>
    </aside>
  );
}

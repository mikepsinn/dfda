import { estimateLabel } from "@/lib/demo/treatment-estimates";

// `cited` says some values on the page are taken from a cited source rather than estimated.
export function EstimateNotice({ cited = false }: { cited?: boolean }) {
  return (
    <aside className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-primary/5 px-4 py-3 text-sm">
      <p className="font-semibold text-primary">{estimateLabel}</p>
      <p className="text-muted-foreground">
        Preliminary estimates, updated as better evidence becomes available.
        {cited && " Values marked with a source are taken from it."}
      </p>
    </aside>
  );
}

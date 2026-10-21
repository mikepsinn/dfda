import { formatIndex, formatMultiple, VERDICT_LABELS } from "@/lib/biomarker-report/format"
import type { PanelVerdict, ReportSummary } from "@/lib/biomarker-report/rules"
import { BAR_CLASSES } from "./StatusBadge"

const GROUPS: { verdict: PanelVerdict; title: string }[] = [
  { verdict: "intended", title: "Moved in the intended direction" },
  { verdict: "unchanged", title: "Stayed unchanged" },
  { verdict: "review", title: "Review with the patient" },
]

/** The first view of a report: the panels by verdict, each panel's index, and the totals. */
export function AtAGlance({ summary, threshold }: { summary: ReportSummary; threshold: number }) {
  const indexes = summary.panels.flatMap((panel) => (panel.index === null ? [] : [Math.abs(panel.index)]))
  // The bars share one scale: at least ±3, and wide enough for the largest index.
  const extent = Math.max(3, Math.ceil(Math.max(...indexes, 0)))
  const share = (value: number) => `${(Math.min(Math.abs(value), extent) / extent) * 50}%`
  const { counts } = summary

  return (
    <section aria-labelledby="glance-heading" className="space-y-6">
      <h2 id="glance-heading" className="text-xl font-semibold">
        At a glance
      </h2>

      <div className="grid gap-4 break-inside-avoid sm:grid-cols-3">
        {GROUPS.map(({ verdict, title }) => {
          const panels = summary.panels.filter((panel) => panel.verdict === verdict)
          return (
            <div key={verdict} className="rounded-xl border bg-card p-4">
              <h3 className="text-sm font-semibold">{title}</h3>
              {panels.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">None</p>
              ) : (
                <ul className="mt-2 space-y-1 text-sm">
                  {panels.map((panel) => (
                    <li key={panel.id}>
                      <a href={`#panel-${panel.id}`} className="underline-offset-4 hover:underline">
                        {panel.name}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_14rem]">
        <div className="space-y-3">
          <ul className="space-y-3">
            {summary.panels.map((panel) => (
              <li key={panel.id} className="grid grid-cols-[1fr_4rem] items-center gap-x-3 gap-y-1 sm:grid-cols-[12rem_1fr_4rem]">
                <span className="col-span-2 text-sm sm:col-span-1">{panel.name}</span>
                {panel.index === null ? (
                  <span className="col-span-2 text-sm text-muted-foreground">No marker with values</span>
                ) : (
                  <>
                    <div
                      className="relative h-3 rounded-full bg-muted/40"
                      role="img"
                      aria-label={`${panel.name}: ${formatIndex(panel.index)} the noise, ${VERDICT_LABELS[panel.verdict].toLowerCase()}`}
                    >
                      <span className="absolute inset-y-0 bg-muted" style={{ left: `${50 - (Math.min(threshold, extent) / extent) * 50}%`, width: `${(Math.min(threshold, extent) / extent) * 100}%` }} />
                      <span className="absolute inset-y-0 left-1/2 w-px bg-foreground/40" />
                      <span
                        className={`absolute inset-y-0.5 rounded-full ${BAR_CLASSES[panel.verdict]}`}
                        style={panel.index >= 0 ? { left: "50%", width: share(panel.index) } : { right: "50%", width: share(panel.index) }}
                      />
                    </div>
                    <span className="text-right text-sm tabular-nums">{formatIndex(panel.index)}</span>
                  </>
                )}
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted-foreground">
            Each bar is the mean change of a system&rsquo;s markers, in multiples of this person&rsquo;s own noise; to the
            right is the intended direction. Bars inside the shaded zone (±{formatMultiple(threshold)}) are not
            distinguishable from no change. Every status compares the person with their own baseline, never with other
            people.
          </p>
        </div>

        <dl className="space-y-3 rounded-xl border bg-card p-4 text-sm">
          <div>
            <dt className="text-muted-foreground">Markers in this report</dt>
            <dd className="text-3xl font-semibold tabular-nums">{counts.total}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Moved in the intended direction</dt>
            <dd className="font-medium tabular-nums">{counts.intended}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Unchanged</dt>
            <dd className="font-medium tabular-nums">{counts.unchanged}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">To review</dt>
            <dd className="font-medium tabular-nums">{counts.review}</dd>
          </div>
          {counts["below-limit"] > 0 && (
            <div>
              <dt className="text-muted-foreground">Below the assay limit</dt>
              <dd className="font-medium tabular-nums">{counts["below-limit"]}</dd>
            </div>
          )}
        </dl>
      </div>
    </section>
  )
}

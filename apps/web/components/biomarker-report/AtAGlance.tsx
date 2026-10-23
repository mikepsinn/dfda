import { TONE_CLASSES } from "@/components/status-tone"
import { formatIndex, formatMultiple, VERDICT_LABELS } from "@/lib/biomarker-report/format"
import type { PanelVerdict, ReportSummary } from "@/lib/biomarker-report/rules"
import type { BiomarkerReport } from "@/lib/biomarker-report/schema"
import { ReportSheet, type SheetFrame } from "./ReportSheet"
import { toneOf } from "./StatusBadge"

const GROUPS: { verdict: PanelVerdict; title: string }[] = [
  { verdict: "intended", title: "Improved" },
  { verdict: "unchanged", title: "Unchanged" },
  { verdict: "review", title: "Review with the patient" },
]

/**
 * The second page: the panels in three groups by verdict, each panel's index
 * on one scale, the totals, the next measurement window and the reading rule.
 */
export function AtAGlance({
  report,
  summary,
  frame,
  personLine,
}: {
  report: BiomarkerReport
  summary: ReportSummary
  frame: SheetFrame
  personLine: string
}) {
  const { threshold } = report
  const noun = report.markerNoun
  const indexes = summary.panels.flatMap((panel) => (panel.index === null ? [] : [Math.abs(panel.index)]))
  // The bars share one scale: at least ±3, and wide enough for the largest index.
  const extent = Math.max(3, Math.ceil(Math.max(...indexes, 0)))
  const position = (value: number) => `${50 + (Math.max(-extent, Math.min(extent, value)) / extent) * 50}%`
  const ticks = [-extent, -threshold, 0, threshold, extent]
  const { counts } = summary
  const texts = { intended: report.glance?.intended, unchanged: report.glance?.unchanged, review: report.glance?.review }

  return (
    <ReportSheet frame={frame} number={2} section="At a glance" personLine={personLine} label="At a glance">
      <h2 className="report-serif text-[1.75rem] leading-tight">Three things to know before the next visit.</h2>

      <div className="grid gap-3 md:grid-cols-3">
        {GROUPS.map(({ verdict, title }) => {
          const tone = TONE_CLASSES[toneOf(verdict)]
          const panels = summary.panels.filter((panel) => panel.verdict === verdict)
          return (
            <div key={verdict} className={`report-card border-t-[3px] p-4 ${tone.topBorder}`}>
              <h3 className={`report-label ${tone.text}`}>{title}</h3>
              {panels.length === 0 ? (
                <p className="report-muted mt-2">None</p>
              ) : (
                <ul className="mt-2 list-disc space-y-0.5 pl-4 font-semibold leading-snug">
                  {panels.map((panel) => (
                    <li key={panel.id}>
                      <a href={`#panel-${panel.id}`} className="underline-offset-4 hover:underline">
                        {panel.name}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
              {texts[verdict] && <p className="report-muted mt-3 text-[12.5px] leading-snug">{texts[verdict]}</p>}
            </div>
          )
        })}
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_15rem] print:grid-cols-[1fr_15rem]">
        <figure className="report-card space-y-3 p-4">
          <div>
            {summary.panels.map((panel) => (
              <div key={panel.id} className="grid grid-cols-[8.5rem_1fr_2rem] items-center gap-x-3 text-[12.5px] sm:grid-cols-[12.5rem_1fr_2rem]">
                <span className="text-right leading-tight">{panel.name}</span>
                {panel.index === null ? (
                  <span className="report-muted">No {noun} with values</span>
                ) : (
                  <div
                    className="relative h-[23px]"
                    role="img"
                    aria-label={`${panel.name}: ${formatIndex(panel.index)} the noise, ${VERDICT_LABELS[panel.verdict].toLowerCase()}`}
                  >
                    <span
                      className="absolute inset-y-0 bg-[color:var(--report-stone-soft)]"
                      style={{ left: position(-threshold), right: `calc(100% - ${position(threshold)})` }}
                    />
                    <span className="absolute inset-y-0 left-1/2 w-px bg-[color:var(--report-stone)]" />
                    <span
                      className={`absolute inset-y-[5px] rounded-[2px] ${TONE_CLASSES[toneOf(panel.verdict)].solid}`}
                      style={
                        panel.index >= 0
                          ? { left: "50%", right: `calc(100% - ${position(panel.index)})` }
                          : { left: position(panel.index), right: "50%" }
                      }
                    />
                  </div>
                )}
                <span className="report-muted text-right text-[11px] tabular-nums">{panel.markers.length}</span>
              </div>
            ))}
            <div className="mt-1 grid grid-cols-[8.5rem_1fr_2rem] gap-x-3 text-[10.5px] sm:grid-cols-[12.5rem_1fr_2rem]">
              <span className="report-muted text-right">
                {formatMultiple(threshold)} noise band · shaded = unchanged zone
              </span>
              <div className="relative h-4" aria-hidden="true">
                {ticks.map((tick) => (
                  <span key={tick} className="report-muted absolute -translate-x-1/2 tabular-nums" style={{ left: position(tick) }}>
                    {tick === 0 ? "0" : `${tick > 0 ? "+" : "−"}${Math.abs(tick)}`}
                  </span>
                ))}
              </div>
              <span className="report-muted text-right">{noun}s</span>
            </div>
          </div>
          <figcaption className="report-muted text-[12px] leading-snug">
            Each bar is the mean shift of an organ system&rsquo;s {noun}s, in multiples of this patient&rsquo;s own
            within-person noise, signed so that right = favourable. Bars inside the shaded zone are indistinguishable from
            no change. This is <strong className="text-[color:var(--report-ink)]">not</strong> a biological age and is not
            comparable across patients.
          </figcaption>
        </figure>

        <div className="space-y-3">
          <div className="report-card p-4">
            <p className="report-label text-[color:var(--report-teal)]">{noun === "protein" ? "Proteins" : "Markers"} in this report</p>
            <p className="report-serif text-[2.75rem] leading-none">{counts.total}</p>
            <p className="report-muted mt-1 text-[12.5px] leading-snug">
              {report.assayCount
                ? `of ${report.assayCount.toLocaleString("en-US")} measured; curated organ panels. Full list on request.`
                : "in curated organ panels."}
            </p>
          </div>
          <div className="report-card p-4">
            <p className="report-label text-[color:var(--report-teal)]">Status split</p>
            <dl className="mt-2 space-y-0.5 text-[12.5px]">
              {(
                [
                  ["intended", "improved"],
                  ["unchanged", "unchanged"],
                  ["review", "review"],
                  ["below-limit", "below quantification"],
                ] as const
              )
                .filter(([status]) => status !== "below-limit" || counts["below-limit"] > 0)
                .map(([status, label]) => (
                  <div key={status} className="grid grid-cols-[1.75rem_1fr]">
                    <dt className={`order-1 font-semibold tabular-nums ${TONE_CLASSES[toneOf(status)].text}`}>{counts[status]}</dt>
                    <dd className="order-2">{label}</dd>
                  </div>
                ))}
            </dl>
          </div>
          {report.glance?.nextWindow && (
            <div className="report-card p-4">
              <p className="report-label text-[color:var(--report-teal)]">Next window</p>
              <p className="mt-2 text-[13.5px] leading-snug">
                <strong className="font-semibold">{report.glance.nextWindow.lead}</strong>
                {report.glance.nextWindow.text}
              </p>
            </div>
          )}
        </div>
      </div>

      <p className="rounded-r-lg border-l-[3px] border-[color:var(--report-teal)] bg-[color:var(--report-teal-soft)] px-4 py-3 text-[13px] leading-snug">
        <strong className="font-semibold">Reading rule.</strong> Teal = moved in the direction the program intends. Stone = did
        not move beyond this patient&rsquo;s own noise. Amber = moved in a direction worth a conversation. A {noun} is never
        flagged on a population reference range alone; the comparison is always to the patient&rsquo;s own baseline.
      </p>
    </ReportSheet>
  )
}

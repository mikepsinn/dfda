import { formatDate } from "@/lib/programs/format"
import { CaseCard, Eyebrow, SERIF, weekLabel } from "./parts"

const DAY = 86_400_000

export function dateAtWeek(startedAt: Date, week: number): Date {
  return new Date(startedAt.getTime() + week * 7 * DAY)
}

/** Who the person is, their program, and when they were measured. */
export function PatientCard({
  name,
  details,
  programName,
  rows,
  heading: Heading = "h1",
}: {
  name: string
  details: string | null
  programName: string
  rows: { term: string; value: string }[]
  /** h1 on the case page; a lower level where the card is one part of a page. */
  heading?: "h1" | "h2" | "h3"
}) {
  return (
    <CaseCard aria-labelledby="patient-name" className="space-y-4">
      <div className="space-y-2">
        <Eyebrow>Patient</Eyebrow>
        <Heading id="patient-name" className={`${SERIF} text-4xl`}>
          {name}
        </Heading>
        <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          {details && <span>{details}</span>}
          <span className="rounded-full bg-[color:var(--tone-teal-soft)] px-2 py-0.5 text-xs font-medium text-[color:var(--tone-teal)]">
            {programName}
          </span>
        </p>
      </div>
      <dl className="divide-y text-sm">
        {rows.map((row) => (
          <div key={row.term} className="flex justify-between gap-4 py-2">
            <dt className="text-muted-foreground">{row.term}</dt>
            <dd className="text-right font-medium">{row.value}</dd>
          </div>
        ))}
      </dl>
    </CaseCard>
  )
}

/** A pseudo-random number generator with a fixed seed, so that the picture is the same on every load. */
function seeded(seed: number) {
  let state = seed
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) % 4_294_967_296
    return state / 4_294_967_296
  }
}

/** A cloud of dots, one for many proteins: a picture only. */
function ProteinCloud() {
  const random = seeded(42)
  const dots = Array.from({ length: 320 }, () => {
    const angle = random() * 2 * Math.PI
    const radius = Math.sqrt(random()) * 70
    return { x: 80 + radius * Math.cos(angle), y: 80 + radius * Math.sin(angle), teal: random() < 0.18 }
  })
  return (
    <svg aria-hidden="true" viewBox="0 0 160 160" className="h-36 w-36 shrink-0">
      {dots.map((dot, index) => (
        <circle key={index} cx={dot.x} cy={dot.y} r={1.3} fill={dot.teal ? "var(--tone-teal)" : "var(--tone-stone)"} opacity={dot.teal ? 0.9 : 0.55} />
      ))}
    </svg>
  )
}

/** The first sample: how many proteins the platform measured, and how it was collected. */
export function SampleCard({ measured, collection, firstLabel }: { measured: string; collection: string | null; firstLabel: string }) {
  return (
    <CaseCard aria-labelledby="sample-heading" className="space-y-3">
      <Eyebrow>Baseline sample</Eyebrow>
      <h2 id="sample-heading" className="font-semibold">
        {measured}
      </h2>
      <div className="flex items-center gap-4">
        <ProteinCloud />
        <div className="space-y-2 text-sm">
          {collection && <p className="text-muted-foreground">{collection}</p>}
          <p className="inline-block rounded-full bg-[color:var(--tone-teal-soft)] px-2 py-0.5 text-xs font-medium text-[color:var(--tone-teal)]">
            {firstLabel} · Day 0
          </p>
        </div>
      </div>
    </CaseCard>
  )
}

const WIDTH = 800
const HEIGHT = 150
const PAD = 40
const GROUND = 120
const PEAK = 36

/**
 * The program as a dotted arc from the start to the follow-up, with a dot for
 * each sample (stone for the first, teal for the latest) and the weeks below.
 * When the follow-up is still to come, an open dot marks it. The labels are
 * text over the drawing, so that they keep their size on a phone.
 */
export function ArcTimeline({
  startedAt,
  samples,
  followUpWeek,
  end,
}: {
  startedAt: Date
  samples: { week: number; label: string }[]
  followUpWeek: number
  end: number
}) {
  const span = Math.max(1, end)
  const x = (week: number) => PAD + (Math.max(0, week) / span) * (WIDTH - 2 * PAD)
  const lastWeek = Math.max(followUpWeek, ...samples.map((sample) => sample.week))
  const x0 = x(0)
  const x1 = x(lastWeek)
  // A quadratic curve with its control point in the middle: x moves evenly with t.
  const yAt = (week: number) => {
    const t = x1 === x0 ? 0 : (x(week) - x0) / (x1 - x0)
    return (1 - t) ** 2 * GROUND + 2 * t * (1 - t) * (2 * PEAK - GROUND) + t ** 2 * GROUND
  }
  const left = (week: number) => `${(x(week) / WIDTH) * 100}%`
  const top = (y: number) => `${(y / HEIGHT) * 100}%`
  const every = span > 26 ? 4 : span > 12 ? 2 : 1
  const ticks = Array.from({ length: Math.floor(span / every) + 1 }, (_, index) => index * every)
  const due = samples.every((sample) => sample.week < followUpWeek)
  const description = samples.length
    ? `Samples: ${samples.map((sample) => `${sample.label} on ${formatDate(dateAtWeek(startedAt, sample.week))}`).join(", ")}.`
    : "No samples yet."

  return (
    <CaseCard aria-labelledby="timeline-heading" className="space-y-2">
      <Eyebrow>Timeline</Eyebrow>
      <h2 id="timeline-heading" className="font-semibold">
        Baseline to follow-up
      </h2>
      <div role="img" aria-label={description} className="pt-4">
        <div className="relative">
          <svg aria-hidden="true" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="block w-full">
            <path
              d={`M ${x0} ${GROUND} Q ${(x0 + x1) / 2} ${2 * PEAK - GROUND} ${x1} ${GROUND}`}
              fill="none"
              stroke="var(--tone-stone)"
              strokeWidth={1.5}
              strokeDasharray="2 6"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
            {due && (
              <circle cx={x(followUpWeek)} cy={yAt(followUpWeek)} r={7} fill="hsl(var(--card))" stroke="var(--tone-stone)" strokeDasharray="2 2" />
            )}
            {samples.map((sample, index) => {
              const first = index === 0
              const latest = index === samples.length - 1 && !first
              const color = first ? "var(--tone-stone)" : "var(--tone-teal)"
              return (
                <circle
                  key={sample.label}
                  cx={x(sample.week)}
                  cy={yAt(sample.week)}
                  r={latest || first ? 8 : 6}
                  fill={latest || first ? color : "var(--tone-teal-soft)"}
                  stroke={color}
                  strokeWidth={1.5}
                />
              )
            })}
          </svg>
          {[...samples.map((sample) => ({ week: sample.week, label: sample.label, strong: true })), ...(due ? [{ week: followUpWeek, label: "Follow-up due", strong: false }] : [])].map(
            (item) => (
              <span
                key={item.label}
                className={`absolute -translate-x-1/2 -translate-y-full whitespace-nowrap pb-2 text-xs ${item.strong ? "font-semibold" : "text-muted-foreground"}`}
                style={{ left: left(item.week), top: top(yAt(item.week) - 8) }}
              >
                {item.label}
              </span>
            ),
          )}
        </div>
        <div className="relative mt-1 h-5 border-t text-[11px] text-muted-foreground">
          {ticks.map((week) => (
            <span
              key={week}
              className={`absolute -translate-x-1/2 whitespace-nowrap pt-1 ${week % (every * 2) !== 0 && week !== 0 ? "max-sm:hidden" : ""}`}
              style={{ left: left(week) }}
            >
              {weekLabel(week)}
            </span>
          ))}
        </div>
      </div>
    </CaseCard>
  )
}

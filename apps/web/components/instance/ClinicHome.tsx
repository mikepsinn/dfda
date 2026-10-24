import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { ArcTimeline, dateAtWeek, PatientCard, SampleCard } from "@/components/care-team/case/Baseline"
import { MarkerCard } from "@/components/care-team/case/FollowUp"
import { CaseCard, Eyebrow, SERIF } from "@/components/care-team/case/parts"
import { TrackLanes } from "@/components/care-team/case/TrackLanes"
import { DemoTryButtons } from "@/components/instance/DemoTryButtons"
import { YourData } from "@/components/instance/YourData"
import { ProgramList } from "@/components/programs/ProgramList"
import { Button } from "@/components/ui/button"
import { decimalsFor, formatMeasuredOrMissing } from "@/lib/biomarker-report/format"
import type { CaseMarker } from "@/lib/care-team/case"
import type { InstanceBranding } from "@/lib/instance/config"
import type { CasePreview } from "@/lib/instance/case-preview"
import type { Program } from "@/lib/programs/data"
import { formatDate } from "@/lib/programs/format"

/** A part of the hero for one audience: who it is for, what they get, and their buttons. */
function Audience({ eyebrow, text, children }: { eyebrow: string; text: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border bg-card p-5">
      <Eyebrow>{eyebrow}</Eyebrow>
      <p className="flex-1 text-sm text-muted-foreground">{text}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  )
}

/** A marker's change in words, for the text of a picture: "CRP 3.8 to 2.2 mg/L". */
function changeText(marker: CaseMarker): string {
  const decimals = decimalsFor(marker.values)
  const value = (number: number | null) => formatMeasuredOrMissing(number, marker.lowerLimit, decimals)
  return `${marker.id} ${value(marker.first)} to ${value(marker.last)} ${marker.unit}`
}

/** A picture made of the case page's parts. One image for screen readers, with the text in `label`. */
function Picture({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div role="img" aria-label={label} className={className}>
      {children}
    </div>
  )
}

/**
 * The home page of a clinic: a company site with a program in which its care
 * team reviews the reports. It speaks to both of its audiences: the patient,
 * who joins a program, and the clinician, who reviews each patient as a case.
 * The pictures are the case page's own parts (components/care-team/case),
 * filled with the demo patient (lib/instance/case-preview.ts); with the demo
 * on, each audience can open it.
 */
export function ClinicHome({
  instance,
  programs,
  joined,
  preview,
}: {
  instance: Pick<InstanceBranding, "name" | "byline" | "tagline" | "demoEnabled">
  programs: Program[]
  joined: Set<string>
  preview: CasePreview
}) {
  const { name } = instance
  const hero = preview.headline.slice(0, 2)
  const chapters = [
    {
      name: "Baseline",
      title: "Before the first dose",
      patient: "Give a first sample before you start. You can collect it at home.",
      clinician: "See the person, the plan and the first sample.",
      label: `The first sample: ${preview.measured}, and the timeline from the start to the follow-up.`,
      picture: (
        <div className="grid gap-4">
          <SampleCard measured={preview.measured} collection={preview.collection} firstLabel={preview.firstLabel} />
          <ArcTimeline
            startedAt={preview.startedAt}
            samples={preview.timeline.samples}
            followUpWeek={preview.followUpWeeks}
            end={preview.timeline.end}
          />
        </div>
      ),
    },
    {
      name: "Track",
      title: "What happens in between",
      patient: "Log your dose and how you feel. It takes a minute a day, and reminders help.",
      clinician: "See the dose, the check-ins and the lab values on the same weeks as the samples.",
      label: "The dose, the check-ins and the lab values of the program, week by week.",
      picture: (
        <CaseCard className="space-y-3">
          <Eyebrow>Track</Eyebrow>
          <TrackLanes timeline={preview.timeline} compact fit />
        </CaseCard>
      ),
    },
    {
      name: "Follow-up",
      title: "The second sample",
      patient: "Your report shows each marker at the start and now, and whether it improved. You see it as soon as it is ready.",
      clinician: "Each marker grouped by pathway, with what was expected and the studies behind it.",
      label: `The largest changes at follow-up: ${preview.headline.map(changeText).join("; ")}.`,
      picture: (
        <ul className="grid grid-cols-2 gap-3">
          {preview.headline.map((marker) => (
            <li key={marker.key}>
              <MarkerCard marker={marker} />
            </li>
          ))}
        </ul>
      ),
    },
    {
      name: "Decide",
      title: "A clinician signs off",
      patient: "You see the review, the note and the clinician's name as soon as they sign.",
      clinician: "The note starts as a draft from the numbers. You edit it, choose the next step and sign off.",
      label: `A clinician's note on the report: ${preview.note}`,
      picture: (
        <CaseCard className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <Eyebrow>Clinician note</Eyebrow>
              <p className="text-lg font-semibold">
                {preview.patientName} · {preview.lastLabel}
              </p>
            </div>
            <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground">Reviewed by clinician</span>
          </div>
          <p className="whitespace-pre-line text-sm leading-relaxed">{preview.note}</p>
        </CaseCard>
      ),
    },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-20 sm:space-y-28">
      <section aria-labelledby="home-heading" className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
        <div className="space-y-8">
          <div className="space-y-2">
            <h1 id="home-heading" className={`${SERIF} text-5xl sm:text-6xl`}>
              {name}
            </h1>
            {instance.byline && <p className="text-lg text-muted-foreground">{instance.byline}</p>}
          </div>
          <div className="space-y-3">
            <p className={`${SERIF} max-w-xl text-2xl leading-snug sm:text-3xl`}>
              {instance.tagline ?? "See how your body responds to treatment."}
            </p>
            <p className="max-w-xl text-muted-foreground">
              A sample before the first dose and one at follow-up, with what happened in between. You see your report as soon
              as it is ready, and a clinician of {name}&rsquo;s care team reviews it.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Audience eyebrow="For patients" text="Join the program for your treatment. You log your doses and how you feel, and your reports come to you.">
              {programs.length > 0 && (
                <Button asChild className="gap-1">
                  <Link href="#programs">
                    See the programs <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  </Link>
                </Button>
              )}
              {instance.demoEnabled && <DemoTryButtons roles={["patient"]} />}
            </Audience>
            <Audience eyebrow="For clinicians" text="Each patient is a case: the baseline, what they logged, the follow-up by pathway, and your note.">
              {instance.demoEnabled ? (
                <DemoTryButtons roles={["clinician"]} variant="default" />
              ) : (
                <Button asChild variant="outline">
                  <Link href="/login">Sign in</Link>
                </Button>
              )}
            </Audience>
          </div>
        </div>
        <Picture
          label={`A patient's case as the care team sees it: ${preview.patientName}, ${preview.programName}, with ${hero.map(changeText).join(" and ")}.`}
          className="grid gap-3"
        >
          <PatientCard
            heading="h2"
            name={preview.patientName}
            details={preview.details}
            programName={preview.programName}
            rows={[
              { term: "Baseline", value: `${formatDate(preview.startedAt)} · Day 0` },
              { term: "Follow-up", value: `${formatDate(dateAtWeek(preview.startedAt, preview.followUpWeeks))} · ${preview.lastLabel}` },
            ]}
          />
          <div className="grid grid-cols-2 gap-3">
            {hero.map((marker) => (
              <MarkerCard key={marker.key} marker={marker} />
            ))}
          </div>
        </Picture>
      </section>

      <section aria-labelledby="how-heading" className="space-y-12">
        <div className="max-w-2xl space-y-3">
          <Eyebrow>How it works</Eyebrow>
          <h2 id="how-heading" className={`${SERIF} text-4xl`}>
            One case, from both sides
          </h2>
          <p className="text-muted-foreground">The patient and the clinician see the same case, in four steps.</p>
        </div>
        <ol className="space-y-16">
          {chapters.map((chapter, index) => (
            <li key={chapter.name} className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
              <div className="space-y-4">
                <Eyebrow>
                  {String(index + 1).padStart(2, "0")} · {chapter.name}
                </Eyebrow>
                <h3 className={`${SERIF} text-3xl`}>{chapter.title}</h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-semibold">For the patient</dt>
                    <dd className="text-muted-foreground">{chapter.patient}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-semibold">For the clinician</dt>
                    <dd className="text-muted-foreground">{chapter.clinician}</dd>
                  </div>
                </dl>
              </div>
              <Picture label={chapter.label} className="min-w-0">
                {chapter.picture}
              </Picture>
            </li>
          ))}
        </ol>
      </section>

      {programs.length > 0 && (
        <section id="programs" aria-labelledby="programs-heading" className="scroll-mt-20 space-y-6">
          <div className="space-y-2">
            <Eyebrow>For patients</Eyebrow>
            <h2 id="programs-heading" className={`${SERIF} text-4xl`}>
              Programs
            </h2>
          </div>
          <ProgramList programs={programs} joined={joined} />
        </section>
      )}

      <YourData name={name} programs={programs} />
    </div>
  )
}

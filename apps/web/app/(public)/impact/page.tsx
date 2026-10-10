import type { Metadata } from "next"
import { ExternalLink, FlaskConical, LineChart, TriangleAlert } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { InternalLinkButton } from "@/components/internal-link-button"
import { getMetadataFromNavKey } from "@/lib/metadata"
import {
  impactSources,
  modelEstimates,
  pragmaticCostReview,
  problemFigures,
  recoveryFigures,
  sourceNumber,
  type ImpactFigure,
  type ImpactSourceId,
} from "@/lib/impact/pragmatic-trial-impact"

export async function generateMetadata(): Promise<Metadata> {
  return getMetadataFromNavKey("impact")
}

const paper = impactSources.find(source => source.id === "impact-paper")!

function Citations({ sourceIds }: { sourceIds: readonly ImpactSourceId[] }) {
  return (
    <>
      {sourceIds.map(id => {
        const number = sourceNumber(id)
        return (
          <sup key={id} className="ml-0.5">
            <a href={`#source-${number}`} aria-label={`Source ${number}`} className="text-primary hover:underline">
              [{number}]
            </a>
          </sup>
        )
      })}
    </>
  )
}

// Four figures fit a 2 × 2 grid; other counts use three columns on wide screens.
function FigureList({ figures, label }: { figures: readonly ImpactFigure[]; label: string }) {
  return (
    <ul aria-label={label} className={`grid gap-4 sm:grid-cols-2 ${figures.length === 4 ? "" : "lg:grid-cols-3"}`}>
      {figures.map(figure => (
        <li key={figure.value} className="flex flex-col gap-2 rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-2xl font-bold tabular-nums text-primary sm:text-3xl">{figure.value}</p>
          <p className="text-sm text-muted-foreground sm:text-base">
            {figure.text}
            <Citations sourceIds={figure.sourceIds} />
          </p>
          {figure.range && (
            <p className="mt-auto text-xs text-muted-foreground">90% range: {figure.range}</p>
          )}
        </li>
      ))}
    </ul>
  )
}

function SectionHeading({ id, icon: Icon, children }: { id: string; icon: LucideIcon; children: ReactNode }) {
  return (
    <h2 id={id} className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
      <Icon aria-hidden="true" className="h-6 w-6 shrink-0 text-primary" />
      {children}
    </h2>
  )
}

export default function ImpactPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-12">
      <header className="space-y-4 rounded-2xl bg-gradient-to-br from-primary/5 to-muted/50 p-6 sm:p-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">The Impact of Universal Pragmatic Trials</h1>
        <p className="max-w-3xl text-muted-foreground sm:text-lg">
          What if every patient could join a clinical trial as part of their normal care? This page shows what that
          could achieve. This is what we are working toward. Our network is a prototype and has no results of its own
          yet.
        </p>
      </header>

      <section aria-labelledby="pragmatic-heading" className="space-y-4">
        <h2 id="pragmatic-heading" className="text-2xl font-semibold tracking-tight">What is a pragmatic trial?</h2>
        <div className="space-y-3 rounded-xl border bg-card p-5 shadow-sm sm:p-6 sm:text-lg">
          <p>
            A pragmatic trial compares treatments inside routine care. Patients stay with their own doctors. Outcomes
            come from health records and patient reports, not from extra visits to a trial site. Most patients can take
            part, so the results apply to the people who actually get the treatment.
          </p>
          <p className="text-muted-foreground">
            In a universal system, any patient with any condition can join a pragmatic trial, and every result goes into
            public Treatment Rankings and Outcome Labels.
          </p>
        </div>
      </section>

      <section aria-labelledby="problem-heading" className="space-y-4">
        <SectionHeading id="problem-heading" icon={TriangleAlert}>The problem today</SectionHeading>
        <FigureList figures={problemFigures} label="The problem today" />
      </section>

      <section aria-labelledby="recovery-heading" className="space-y-4">
        <SectionHeading id="recovery-heading" icon={FlaskConical}>Proof that it works: the RECOVERY trial</SectionHeading>
        <FigureList figures={recoveryFigures} label="RECOVERY trial results" />
        <p className="text-muted-foreground">
          {pragmaticCostReview.text}
          <Citations sourceIds={pragmaticCostReview.sourceIds} />
        </p>
      </section>

      <section aria-labelledby="estimates-heading" className="space-y-4">
        <SectionHeading id="estimates-heading" icon={LineChart}>What universal pragmatic trials could do</SectionHeading>
        <p className="max-w-3xl text-muted-foreground">
          These are model estimates from <cite>{paper.label}</cite>, not results. The ranges are 90% confidence
          intervals.
        </p>
        <FigureList figures={modelEstimates} label="Model estimates" />
        <Button asChild variant="outline" className="gap-2">
          <a href={paper.url} target="_blank" rel="noopener noreferrer">
            Read the analysis <ExternalLink aria-hidden="true" className="h-4 w-4" />
          </a>
        </Button>
      </section>

      <section aria-labelledby="goal-heading" className="space-y-4 rounded-2xl bg-muted p-6 text-center sm:p-8">
        <h2 id="goal-heading" className="text-2xl font-semibold tracking-tight">From goal to reality</h2>
        <p className="mx-auto max-w-2xl sm:text-lg">
          RECOVERY showed what one pragmatic trial can do. We aim to make pragmatic trials available to every patient, for
          every condition, and to publish every result.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <InternalLinkButton navKey="find_trials" variant="default" />
          <InternalLinkButton navKey="research_partner_create_trial" variant="outline" />
          <InternalLinkButton navKey="developers" variant="outline" />
        </div>
      </section>

      <section aria-labelledby="sources-heading" className="space-y-3">
        <h2 id="sources-heading" className="text-xl font-semibold tracking-tight">Sources</h2>
        <ol aria-labelledby="sources-heading" className="list-decimal space-y-2 pl-6 text-sm text-muted-foreground">
          {impactSources.map((source, index) => (
            <li key={source.id} id={`source-${index + 1}`} className="scroll-mt-24">
              <a href={source.url} target="_blank" rel="noopener noreferrer" className="break-words hover:text-foreground hover:underline">
                {source.label}
              </a>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}

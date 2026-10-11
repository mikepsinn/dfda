import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, ExternalLink, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProgramTotals } from "@/components/programs/ProgramTotals"
import { BETTER_LABELS, KIND_LABELS } from "@/lib/programs/config"
import { programDashboard, reportItems } from "@/lib/programs/data"
import { programPreviewPath, requireOwnedProgram } from "@/lib/programs/owner"
import { MIN_GROUP_SIZE } from "@/lib/programs/report"
import { SAMPLE_SIZE, sampleView } from "@/lib/programs/sample"

export const metadata: Metadata = { title: "Program" }

export default async function ProgramDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; program: string }>
  searchParams: Promise<{ view?: string; created?: string; saved?: string }>
}) {
  const [{ slug, program: programSlug }, query] = await Promise.all([params, searchParams])
  const { user, instance, program } = await requireOwnedProgram(slug, programSlug)
  const sample = query.view === "sample"
  const view = sample ? sampleView(program, reportItems(program)) : await programDashboard(user.id, program)
  const base = `/instances/${instance.slug}/programs/${program.slug}`
  const tabClass = (active: boolean) =>
    `rounded-md px-3 py-1.5 text-sm font-medium ${active ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="space-y-3">
        <Link href={`/instances/${instance.slug}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft aria-hidden="true" className="h-4 w-4" /> {instance.name}
        </Link>
        {(query.created || query.saved) && (
          <p role="status" className="flex items-center gap-2 font-medium text-primary">
            <CheckCircle2 aria-hidden="true" className="h-5 w-5" />
            {query.created ? "The program is live. People can join it now." : "Your changes are saved."}
          </p>
        )}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">{program.name}</h1>
            {program.summary && <p className="max-w-2xl text-muted-foreground">{program.summary}</p>}
          </div>
          <div className="flex shrink-0 gap-2">
            <Button asChild variant="outline" size="sm" className="gap-2">
              <a href={programPreviewPath(instance.slug, program.slug)} target="_blank" rel="noopener noreferrer">
                Program page <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
              </a>
            </Button>
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link href={`${base}/edit`}>
                <Pencil aria-hidden="true" className="h-3.5 w-3.5" /> Change
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <section aria-labelledby="tracked-heading" className="space-y-2">
        <h2 id="tracked-heading" className="text-sm font-medium text-muted-foreground">
          What people track · follow-up at week {program.followUpWeeks}
        </h2>
        <ul className="flex flex-wrap gap-2">
          {program.items.map((item) => (
            <li key={item.id} className="rounded-full border px-3 py-1 text-sm">
              <span className="text-muted-foreground">{KIND_LABELS[item.kind]}:</span> {item.name} ({item.unit})
              {item.frequency && <span className="text-muted-foreground">, {item.frequency}</span>}
              {item.better && item.better !== "neither" && (
                <span className="text-muted-foreground">, {BETTER_LABELS[item.better].toLowerCase()}</span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="results-heading" className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 id="results-heading" className="text-xl font-semibold">
            Results
          </h2>
          <nav aria-label="Data shown" className="inline-flex rounded-lg bg-muted p-1">
            <Link href={base} className={tabClass(!sample)} aria-current={!sample ? "page" : undefined}>
              Your customers
            </Link>
            <Link href={`${base}?view=sample`} className={tabClass(sample)} aria-current={sample ? "page" : undefined}>
              Sample data
            </Link>
          </nav>
        </div>

        {sample && (
          <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
            <strong>Sample data:</strong> {SAMPLE_SIZE} made-up people, to show how this page looks once people join.
            These numbers are invented. They are not results.{" "}
            <a
              href={programPreviewPath(instance.slug, `${program.slug}/example`)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline"
            >
              See a sample person&apos;s report
            </a>
          </p>
        )}

        <p className="text-lg">
          <span className="font-semibold">{view.enrolled}</span> {view.enrolled === 1 ? "person has" : "people have"} joined.
        </p>

        {view.enrolled === 0 ? (
          <p className="text-muted-foreground">
            Nobody has joined yet. Share the program page, or open <Link href={`${base}?view=sample`} className="underline">Sample data</Link>{" "}
            to see how this page will look.
          </p>
        ) : (
          <ProgramTotals totals={view.totals} />
        )}
        <p className="text-sm text-muted-foreground">
          Totals only: you do not see any one person&apos;s values. A measure appears when at least {MIN_GROUP_SIZE} people
          have a value at the start and a later one. A change after the start does not prove that the product caused it.
        </p>
      </section>
    </div>
  )
}

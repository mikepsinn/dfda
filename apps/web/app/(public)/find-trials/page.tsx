import type { Metadata } from "next"
import Link from "next/link"
import { FlaskConical } from "lucide-react"
import { RegistryTrialList } from "@/components/trials/registry-trial-list"
import { TrialSearchForm } from "@/components/trials/trial-search-form"
import { getMetadataFromNavKey } from "@/lib/metadata"
import { isRegistryPageToken, registryPagePosition, searchRegistryTrials } from "@/lib/trials/registry-trials"
import { describeTrialSearch, parseTrialSearch, trialSearchQuery } from "@/lib/trials/trial-search"

export async function generateMetadata(): Promise<Metadata> {
  return getMetadataFromNavKey("find_trials")
}

const examples = [
  { label: "Asthma", href: "/find-trials?condition=Asthma#results" },
  { label: "Migraine trials in Germany", href: "/find-trials?condition=Migraine&location=Germany#results" },
  { label: "Metformin", href: "/find-trials?treatment=Metformin#results" },
]

export default async function FindTrialsPage({
  searchParams,
}: {
  // The form's fields; pageToken, page and total are the registry's page cursor and carried display values.
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const { form, search, error } = parseTrialSearch(params)
  const pageToken = isRegistryPageToken(params.pageToken) ? params.pageToken : undefined
  const registry = search ? await searchRegistryTrials(search, { pageToken }) : null
  const position = registry ? registryPagePosition(registry, { pageToken, page: params.page, total: params.total }) : null

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="space-y-4 rounded-2xl bg-gradient-to-br from-primary/5 to-muted/50 p-6 sm:p-8">
        <p className="inline-flex items-center gap-2 rounded-full bg-background px-3 py-1 text-sm font-medium text-primary">
          <FlaskConical aria-hidden="true" className="h-4 w-4" /> Clinical trials
        </p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Find Clinical Trials</h1>
        <p className="max-w-2xl text-muted-foreground sm:text-lg">
          Search the studies registered on ClinicalTrials.gov by condition, treatment and location. Then filter by who
          can join.
        </p>
      </header>

      <TrialSearchForm form={form} />

      {/* The form's action and the page links scroll here; the margin keeps it below the sticky header. */}
      <div id="results" className="scroll-mt-24 space-y-8">
        {error && (
          <p role="alert" className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-sm">
            {error}
          </p>
        )}

        {registry && position ? (
          <>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted-foreground">Showing studies for:</span>
              <ul aria-label="Search criteria" className="flex flex-wrap gap-2">
                {describeTrialSearch(form).map(phrase => (
                  <li key={phrase} className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">{phrase}</li>
                ))}
              </ul>
              <a href="#trial-search" className="font-medium text-primary underline-offset-4 hover:underline">Change search</a>
            </div>
            <RegistryTrialList
              result={registry}
              page={position.page}
              total={position.total}
              basePath="/find-trials"
              query={trialSearchQuery(form)}
              heading="Results from ClinicalTrials.gov"
              countNoun="matching studies"
              emptyText="ClinicalTrials.gov lists no studies that match this search. Try another spelling, fewer filters or a wider location."
              registryLinkText="Search ClinicalTrials.gov directly"
              failedLinkText="Search ClinicalTrials.gov directly"
            />
          </>
        ) : (
          !error && (
            <div className="space-y-3 rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
              <p>Enter a condition, a treatment or a location to see matching studies.</p>
              <p className="flex flex-wrap items-center gap-2">
                <span>Examples:</span>
                {examples.map(example => (
                  <Link key={example.href} href={example.href}
                    className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary hover:bg-primary/15">
                    {example.label}
                  </Link>
                ))}
              </p>
            </div>
          )
        )}
      </div>
    </div>
  )
}

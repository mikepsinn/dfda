import type { ReactNode } from "react"
import Link from "next/link"
import { Building2, CalendarDays, ChevronLeft, ChevronRight, ExternalLink, Hash, MapPin } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  REGISTRY_PAGE_SIZE,
  formatRegistryCode,
  formatRegistryDate,
  formatRegistryPhases,
  type RegistryTrial,
  type RegistryTrialsResult,
} from "@/lib/trials/registry-trials"
import { ExpandableSummary } from "./expandable-summary"

interface RegistryTrialListProps {
  condition: string
  result: RegistryTrialsResult
  // 1-based number of the page shown, and the path that the page links go to.
  page: number
  basePath: string
  // Matching studies in the registry. Only the first page reports it, so later pages
  // get it from the page link; null when it is unknown.
  total: number | null
}

// Recruiting studies registered on ClinicalTrials.gov, one page at a time. Each links to its registry record.
export function RegistryTrialList({ condition, result, page, basePath, total }: RegistryTrialListProps) {
  return (
    <section aria-labelledby="registry-trials" className="space-y-4">
      <div className="space-y-1">
        <h2 id="registry-trials" className="text-2xl font-semibold">
          Recruiting on ClinicalTrials.gov
        </h2>
        <p className="text-sm text-muted-foreground">
          Studies registered on ClinicalTrials.gov, the U.S. National Library of Medicine&apos;s trial registry. A
          listing is not a recommendation: we have not reviewed these studies.
        </p>
      </div>

      {!result.ok ? (
        <Card>
          <CardContent className="space-y-3 p-6">
            <p className="text-sm">ClinicalTrials.gov did not respond. You can search the registry directly.</p>
            <SearchLink href={result.searchUrl}>Search ClinicalTrials.gov for {condition}</SearchLink>
          </CardContent>
        </Card>
      ) : result.trials.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            ClinicalTrials.gov lists no recruiting studies for {condition}.
          </CardContent>
        </Card>
      ) : (
        <>
          {result.paginationReset && (
            <p role="status" className="rounded-lg border bg-muted/50 p-4 text-sm">
              That results page has expired. These are the latest results, from the first page.
            </p>
          )}
          <p className="text-sm tabular-nums text-muted-foreground">
            Showing {(page - 1) * REGISTRY_PAGE_SIZE + 1}–{(page - 1) * REGISTRY_PAGE_SIZE + result.trials.length}
            {total !== null && ` of ${total.toLocaleString("en-US")}`} recruiting studies, most relevant first.
          </p>
          <ul className="space-y-4">
            {result.trials.map(trial => (
              <li key={trial.nctId}>
                <RegistryTrialCard trial={trial} />
              </li>
            ))}
          </ul>
          <Pagination
            page={page}
            total={total}
            nextPageToken={result.nextPageToken}
            basePath={basePath}
          />
          <SearchLink href={result.searchUrl}>Search and filter all of them on ClinicalTrials.gov</SearchLink>
        </>
      )}
    </section>
  )
}

function RegistryTrialCard({ trial }: { trial: RegistryTrial }) {
  const phase = formatRegistryPhases(trial.phases)
  const [firstLocation, ...otherLocations] = trial.locations

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <div aria-hidden="true" className="h-1 bg-gradient-to-r from-primary/80 via-primary/40 to-transparent" />
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {trial.status && <StatusBadge status={trial.status} />}
          {phase && <Badge variant="secondary">{phase}</Badge>}
          {trial.studyType && <Badge variant="outline">{formatRegistryCode(trial.studyType)}</Badge>}
        </div>
        <h3 className="break-words text-xl font-semibold leading-snug">{trial.title}</h3>
        {trial.sponsor && (
          <p className="flex items-start gap-2 text-sm text-muted-foreground">
            <Building2 aria-hidden="true" className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{trial.sponsor}</span>
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-5">
        {trial.summary && <ExpandableSummary text={trial.summary} />}

        <dl className="grid gap-4 text-sm sm:grid-cols-3">
          <Fact icon={<CalendarDays aria-hidden="true" className="h-4 w-4" />} label="Start date">
            {trial.startDate ? formatRegistryDate(trial.startDate) : "Not provided"}
          </Fact>
          <Fact icon={<MapPin aria-hidden="true" className="h-4 w-4" />} label="Locations">
            {firstLocation
              ? `${firstLocation}${otherLocations.length > 0 ? ` and ${otherLocations.length} more` : ""}`
              : "Not provided"}
          </Fact>
          <Fact icon={<Hash aria-hidden="true" className="h-4 w-4" />} label="Trial ID">
            <span className="tabular-nums">{trial.nctId}</span>
          </Fact>
        </dl>

        {trial.interventions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Treatments being tested</h4>
            <ul className="flex flex-wrap gap-2">
              {trial.interventions.map(intervention => (
                <li
                  key={intervention}
                  className="break-words rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
                >
                  {intervention}
                </li>
              ))}
            </ul>
          </div>
        )}

        <Button asChild className="w-full sm:w-auto">
          <a href={trial.url} target="_blank" rel="noopener noreferrer">
            Learn more and join
            <ExternalLink aria-hidden="true" className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </CardContent>
    </Card>
  )
}

// Recruiting studies are green; any other status is neutral. The text always names the status.
function StatusBadge({ status }: { status: string }) {
  const recruiting = status === "RECRUITING"
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        recruiting ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-muted text-muted-foreground"
      }`}
    >
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${recruiting ? "bg-emerald-500" : "bg-muted-foreground"}`} />
      {formatRegistryCode(status)}
    </span>
  )
}

function Fact({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="min-w-0">
        <dt className="font-medium">{label}</dt>
        <dd className="break-words text-muted-foreground">{children}</dd>
      </div>
    </div>
  )
}

// From crowdsourcing-cures: the registry gives only a cursor for the next page,
// so the way back goes to the first page.
function Pagination({
  page,
  total,
  nextPageToken,
  basePath,
}: {
  page: number
  total: number | null
  nextPageToken: string | null
  basePath: string
}) {
  const totalPages = total === null ? null : Math.max(page, Math.ceil(total / REGISTRY_PAGE_SIZE))
  const nextQuery = new URLSearchParams({ page: String(page + 1), pageToken: nextPageToken ?? "" })
  if (total !== null) nextQuery.set("total", String(total))
  const nextHref = nextPageToken ? `${basePath}?${nextQuery}` : null

  return (
    <nav aria-label="Result pages" className="flex items-center justify-between gap-4">
      {page > 1 ? (
        <Button variant="outline" asChild>
          <Link href={basePath} prefetch={false}>
            <ChevronLeft aria-hidden="true" className="mr-1 h-4 w-4" />
            First page
          </Link>
        </Button>
      ) : (
        <Button variant="outline" disabled>
          <ChevronLeft aria-hidden="true" className="mr-1 h-4 w-4" />
          First page
        </Button>
      )}
      <p className="text-sm tabular-nums text-muted-foreground">
        Page {page}
        {totalPages !== null && ` of ${totalPages.toLocaleString("en-US")}`}
      </p>
      {nextHref ? (
        <Button variant="outline" asChild>
          <Link href={nextHref} prefetch={false} rel="nofollow">
            Next
            <ChevronRight aria-hidden="true" className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      ) : (
        <Button variant="outline" disabled>
          Next
          <ChevronRight aria-hidden="true" className="ml-1 h-4 w-4" />
        </Button>
      )}
    </nav>
  )
}

function SearchLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center text-sm font-medium text-primary hover:underline"
    >
      {children}
      <ExternalLink aria-hidden="true" className="ml-1 h-3 w-3" />
    </a>
  )
}

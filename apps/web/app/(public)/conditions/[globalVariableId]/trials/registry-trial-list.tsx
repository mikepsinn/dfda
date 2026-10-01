import type { ReactNode } from "react"
import { ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  formatRegistryPhases,
  formatRegistryStudyType,
  type RegistryTrial,
  type RegistryTrialsResult,
} from "@/lib/trials/registry-trials"

interface RegistryTrialListProps {
  condition: string
  result: RegistryTrialsResult
}

// Recruiting studies registered on ClinicalTrials.gov. Each links to its registry record.
export function RegistryTrialList({ condition, result }: RegistryTrialListProps) {
  return (
    <section aria-labelledby="registry-trials" className="space-y-4">
      <div className="space-y-1">
        <h2 id="registry-trials" className="text-2xl font-semibold">
          Recruiting on ClinicalTrials.gov
        </h2>
        <p className="text-sm text-muted-foreground">
          Studies registered on ClinicalTrials.gov, the U.S. National Library of Medicine&apos;s trial registry. A
          listing is not a recommendation: dFDA has not reviewed these studies.
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
          <p className="text-sm">
            {result.total > result.trials.length
              ? `The ${result.trials.length} most relevant of ${result.total.toLocaleString("en-US")} recruiting studies.`
              : `${result.trials.length} recruiting ${result.trials.length === 1 ? "study" : "studies"}.`}
          </p>
          <ul className="space-y-4">
            {result.trials.map(trial => (
              <li key={trial.nctId}>
                <RegistryTrialCard trial={trial} />
              </li>
            ))}
          </ul>
          {result.total > result.trials.length && (
            <SearchLink href={result.searchUrl}>
              See all {result.total.toLocaleString("en-US")} on ClinicalTrials.gov
            </SearchLink>
          )}
        </>
      )}
    </section>
  )
}

function RegistryTrialCard({ trial }: { trial: RegistryTrial }) {
  const phase = formatRegistryPhases(trial.phases)
  const [firstLocation, ...otherLocations] = trial.locations
  const shownInterventions = trial.interventions.slice(0, 3)
  const hiddenInterventions = trial.interventions.length - shownInterventions.length

  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="tabular-nums">{trial.nctId}</Badge>
          {phase && <Badge variant="secondary">{phase}</Badge>}
          {trial.studyType && <Badge variant="secondary">{formatRegistryStudyType(trial.studyType)}</Badge>}
        </div>
        <h3 className="break-words text-lg font-semibold leading-snug">{trial.title}</h3>
        {trial.sponsor && <p className="text-sm text-muted-foreground">Sponsor: {trial.sponsor}</p>}
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          {shownInterventions.length > 0 && (
            <div>
              <dt className="font-medium">Interventions</dt>
              <dd className="break-words text-muted-foreground">
                {shownInterventions.join(", ")}
                {hiddenInterventions > 0 && ` and ${hiddenInterventions} more`}
              </dd>
            </div>
          )}
          {firstLocation && (
            <div>
              <dt className="font-medium">Locations</dt>
              <dd className="break-words text-muted-foreground">
                {firstLocation}
                {otherLocations.length > 0 &&
                  ` and ${otherLocations.length} more ${otherLocations.length === 1 ? "location" : "locations"}`}
              </dd>
            </div>
          )}
        </dl>
        <Button variant="outline" asChild>
          <a href={trial.url} target="_blank" rel="noopener noreferrer">
            View on ClinicalTrials.gov
            <ExternalLink aria-hidden="true" className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </CardContent>
    </Card>
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

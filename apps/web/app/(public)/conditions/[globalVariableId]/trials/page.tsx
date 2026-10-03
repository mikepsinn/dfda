import { getGlobalConditionByIdAction } from "@/lib/actions/conditions"
import { getTrialsByConditionAction } from "@/lib/actions/trials"
import { getRecruitingRegistryTrials, isRegistryPageToken, registryPagePosition } from "@/lib/trials/registry-trials"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, FlaskConical, SlidersHorizontal } from "lucide-react"
import { notFound } from "next/navigation"
import { RegistryTrialList } from "@/components/trials/registry-trial-list"

export default async function ConditionTrialsPage({
  params,
  searchParams,
}: {
  params: Promise<{ globalVariableId: string }>
  // pageToken is the registry's cursor for the requested page. page (its number) and total (the
  // first page's match count, which later pages do not report) are carried for display only.
  searchParams: Promise<{ page?: string | string[]; pageToken?: string | string[]; total?: string | string[] }>
}) {
  // The segment is the condition's global variable id, as linked from /conditions.
  const conditionId = decodeURIComponent((await params).globalVariableId);
  const query = await searchParams;
  const pageToken = isRegistryPageToken(query.pageToken) ? query.pageToken : undefined;

  const condition = await getGlobalConditionByIdAction(conditionId);

  if (!condition) {
    notFound();
  }

  // Trials hosted on this site (shown on the first page only), and recruiting studies from the public registry.
  const [trials, registry] = await Promise.all([
    pageToken ? [] : getTrialsByConditionAction(conditionId),
    getRecruitingRegistryTrials(condition.name, { pageToken }),
  ]);
  const { page, total } = registryPagePosition(registry, { pageToken, page: query.page, total: query.total });

  return (
    <div className="container mx-auto max-w-5xl py-6 space-y-8">
      <header className="band-soft space-y-4 py-8">
        <Button variant="ghost" size="sm" asChild className="-ml-3">
          <Link href="/conditions">
            <ArrowLeft aria-hidden="true" className="mr-1 h-4 w-4" />
            All conditions
          </Link>
        </Button>
        <div className="space-y-2">
          <h1 className="break-words text-3xl font-bold md:text-4xl">{condition.name}</h1>
          <p className="text-muted-foreground">Recruiting clinical trials for {condition.name}</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/find-trials?condition=${encodeURIComponent(condition.name)}`}>
            <SlidersHorizontal aria-hidden="true" className="mr-2 h-4 w-4" />
            Filter by location, age and more
          </Link>
        </Button>
        {total !== null && total > 0 && (
          <p className="inline-flex items-center gap-2 rounded-full bg-background px-3 py-1 text-sm font-medium shadow-sm">
            <FlaskConical aria-hidden="true" className="h-4 w-4 text-primary" />
            <span>
              <span className="tabular-nums">{total.toLocaleString("en-US")}</span> recruiting studies on
              ClinicalTrials.gov
            </span>
          </p>
        )}
      </header>

      {trials.length > 0 && (
        <section aria-labelledby="site-trials" className="space-y-4">
          <h2 id="site-trials" className="text-2xl font-semibold">
            Trials on our network
          </h2>
          {trials.map((trial) => (
            <Card key={trial.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{trial.title}</CardTitle>
                    <CardDescription>{trial.research_partner_name || 'Unknown Sponsor'}</CardDescription>
                  </div>
                  <Badge>{trial.phase || 'N/A'}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p>{trial.description || 'No description available.'}</p>
                  <div className="flex gap-2">
                    <Button asChild>
                      <Link href={`/patient/trial-details/${trial.id}`}>View Details</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      <RegistryTrialList
        result={registry}
        page={page}
        total={total}
        basePath={`/conditions/${encodeURIComponent(conditionId)}/trials`}
        heading="Recruiting on ClinicalTrials.gov"
        countNoun="recruiting studies"
        emptyText={`ClinicalTrials.gov lists no recruiting studies for ${condition.name}.`}
        registryLinkText="Search and filter all of them on ClinicalTrials.gov"
        failedLinkText={`Search ClinicalTrials.gov for ${condition.name}`}
      />
    </div>
  )
}

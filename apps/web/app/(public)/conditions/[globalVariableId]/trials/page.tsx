import { getGlobalConditionByIdAction } from "@/lib/actions/conditions"
import { getTrialsByConditionAction } from "@/lib/actions/trials"
import { getRecruitingRegistryTrials } from "@/lib/trials/registry-trials"
import { env } from "@/lib/env"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { notFound } from "next/navigation"
import { RegistryTrialList } from "./registry-trial-list"

export default async function ConditionTrialsPage({
  params,
}: {
  params: Promise<{ globalVariableId: string }>
}) {
  // The segment is the condition's global variable id, as linked from /conditions and /find-trials.
  const conditionId = decodeURIComponent((await params).globalVariableId);

  const condition = await getGlobalConditionByIdAction(conditionId);

  if (!condition) {
    notFound();
  }

  // Trials hosted on this site, and recruiting studies from the public registry.
  const [trials, registry] = await Promise.all([
    getTrialsByConditionAction(conditionId),
    getRecruitingRegistryTrials(condition.name),
  ]);

  return (
    <div className="container max-w-4xl py-6 space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/conditions" aria-label="Back to conditions">
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{condition.name}</h1>
          <p className="text-muted-foreground">
            Recruiting clinical trials for {condition.name}
          </p>
        </div>
      </div>

      {trials.length > 0 && (
        <section aria-labelledby="site-trials" className="space-y-4">
          <h2 id="site-trials" className="text-2xl font-semibold">
            Trials on {env.NEXT_PUBLIC_SITE_NAME}
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

      <RegistryTrialList condition={condition.name} result={registry} siteName={env.NEXT_PUBLIC_SITE_NAME} />
    </div>
  )
}

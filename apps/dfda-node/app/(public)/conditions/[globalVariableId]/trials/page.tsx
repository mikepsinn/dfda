import { getConditionByNameAction } from "@/lib/actions/conditions"
import { getTrialsByConditionAction } from "@/lib/actions/trials"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { notFound } from "next/navigation"

export default async function ConditionTrialsPage({
  params,
}: {
  params: { conditionId: string }
}) {
  const conditionSlug = decodeURIComponent(params.conditionId);

  const condition = await getConditionByNameAction(conditionSlug);

  if (!condition) {
    notFound();
  }

  const trials = await getTrialsByConditionAction(conditionSlug);

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/conditions">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{condition.name}</h1>
          <p className="text-muted-foreground">
            Clinical trials for {condition.name}
          </p>
        </div>
      </div>

      {trials.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Trials Found</CardTitle>
            <CardDescription>
              There are currently no active clinical trials for this condition.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-4">
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
                      <Link href={`/trials/${trial.id}`}>View Details</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 
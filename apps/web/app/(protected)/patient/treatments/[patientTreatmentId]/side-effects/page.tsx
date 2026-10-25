import { getServerUser } from '@/lib/server-auth'
import { redirect, notFound } from "next/navigation"
import { X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { AddSideEffectForm } from "@/components/programs/AddSideEffectForm"
import { getPatientTreatmentDetailAction } from '@/lib/actions/patient-treatments'
import { stopSideEffectAction, trackSideEffectAction } from '@/lib/actions/treatment-side-effects'
import { formatDate } from "@/lib/programs/format"
import { mySideEffects, mySymptomRatings, sideEffectOptions } from "@/lib/programs/side-effects"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb"

/**
 * The side effects of a treatment: the symptoms that the person rated since
 * they started it, and the symptoms that they track with a daily reminder
 * (lib/programs/side-effects.ts).
 */
export default async function TreatmentSideEffectsPage({ params }: { params: Promise<{ patientTreatmentId: string }> }) {
  const { patientTreatmentId } = await params;
  const user = await getServerUser()

  if (!user) {
    redirect("/login?message=Please log in to view treatment side effects.")
  }

  const treatmentDetails = await getPatientTreatmentDetailAction(patientTreatmentId, user.id);
  if (!treatmentDetails) notFound();

  const treatmentName =
    treatmentDetails.global_treatments?.global_variables?.name ?? "Unknown Treatment";
  const startedAt = treatmentDetails.start_date ?? treatmentDetails.created_at ?? new Date()
  const [rated, tracked, options] = await Promise.all([
    mySymptomRatings(user, startedAt),
    mySideEffects(user),
    sideEffectOptions(user),
  ])
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/patient/treatments">Treatments</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/patient/treatments/${patientTreatmentId}`}>{treatmentName}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Side Effects</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">Side Effects for {treatmentName}</h2>
        <p className="text-muted-foreground">
          The symptoms that you rated since you started {treatmentName} on {formatDate(startedAt)}.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle>Rated Symptoms</CardTitle>
            <CardDescription>Your ratings, the newest first.</CardDescription>
          </div>
          <Badge variant="secondary">{rated.length}</Badge>
        </CardHeader>
        <CardContent>
          {rated.length > 0 ? (
            <ul aria-label="Rated symptoms" className="space-y-3">
              {rated.map(({ item, ratings }) => (
                <li key={item.variableId} className="flex items-start justify-between gap-4 rounded-md border bg-muted/50 p-3">
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {ratings.length} rating{ratings.length !== 1 ? "s" : ""}. The last one is from {formatDate(ratings[0].at)}.
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {ratings[0].value} ({ratings[0].unit})
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-4 text-center text-muted-foreground">You did not rate a symptom since you started {treatmentName}.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Track a Side Effect</CardTitle>
          <CardDescription>
            Feel something new? Add it here. Each one gets a daily reminder to rate it, which you can change on{" "}
            <Link href="/patient/reminders" className="font-medium underline">
              your reminders page
            </Link>
            .
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {tracked.length > 0 && (
            <ul aria-label="Side effects you track" className="flex flex-wrap gap-2">
              {tracked.map((item) => (
                <li key={item.id} className="flex items-center gap-1 rounded-full border py-1 pl-3 pr-1 text-sm">
                  {item.name}
                  <form action={stopSideEffectAction.bind(null, patientTreatmentId, item.variableId)}>
                    <Button type="submit" variant="ghost" size="icon" className="h-6 w-6 rounded-full" aria-label={`Stop tracking ${item.name}`}>
                      <X aria-hidden="true" className="h-3.5 w-3.5" />
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
          <AddSideEffectForm
            action={trackSideEffectAction.bind(null, patientTreatmentId)}
            options={options.filter((option) => !tracked.some((item) => item.variableId === option.id))}
            date={today}
          />
        </CardContent>
      </Card>
    </div>
  );
}

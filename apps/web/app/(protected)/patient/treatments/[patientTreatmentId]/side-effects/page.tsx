import { getServerUser } from '@/lib/server-auth'
import { redirect, notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { AddSideEffectForm } from "@/components/programs/AddSideEffectForm"
import { RatedSymptomList } from "@/components/symptoms/RatedSymptomList"
import { getPatientTreatmentDetailAction } from '@/lib/actions/patient-treatments'
import { linkSideEffectAction, trackSideEffectAction, unlinkSideEffectAction } from '@/lib/actions/treatment-side-effects'
import { formatDate } from "@/lib/programs/format"
import { mySymptomRatings, symptomOptions, treatmentSideEffects } from "@/lib/programs/side-effects"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb"

/**
 * The side effects of a treatment: the symptoms that the person thinks it
 * causes (patient_side_effects), with their ratings since it started, and the
 * other symptoms that they rated since then, which they can add
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
  const [sideEffects, rated, options] = await Promise.all([
    treatmentSideEffects(user, patientTreatmentId, startedAt),
    mySymptomRatings(user, startedAt),
    symptomOptions(),
  ])
  const linked = new Set(sideEffects.map(({ item }) => item.variableId))
  const others = rated.filter(({ item }) => !linked.has(item.variableId))
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
          The symptoms that you think {treatmentName} causes, with your ratings since you started it on {formatDate(startedAt)}.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle>Your Side Effects</CardTitle>
            <CardDescription>
              Removing a side effect keeps its ratings and its daily reminder. You can stop the reminder on{" "}
              <Link href="/patient/reminders" className="font-medium underline">
                your reminders page
              </Link>
              .
            </CardDescription>
          </div>
          <Badge variant="secondary">{sideEffects.length}</Badge>
        </CardHeader>
        <CardContent>
          {sideEffects.length > 0 ? (
            <RatedSymptomList
              label={`Side effects of ${treatmentName}`}
              symptoms={sideEffects}
              action={{
                label: (name) => `Remove ${name} from the side effects of ${treatmentName}`,
                form: (variableId) => unlinkSideEffectAction.bind(null, patientTreatmentId, variableId),
              }}
            />
          ) : (
            <p className="py-4 text-center text-muted-foreground">You did not add a side effect of {treatmentName}.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add a Side Effect</CardTitle>
          <CardDescription>
            Choose a symptom that you think {treatmentName} causes. Each one gets a daily reminder to rate it, which you
            can change on{" "}
            <Link href="/patient/reminders" className="font-medium underline">
              your reminders page
            </Link>
            .
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AddSideEffectForm
            action={trackSideEffectAction.bind(null, patientTreatmentId)}
            options={options.filter((option) => !linked.has(option.id))}
            date={today}
          />
        </CardContent>
      </Card>

      {others.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Other Symptoms You Rated</CardTitle>
            <CardDescription>Since you started {treatmentName}. Add one if you think {treatmentName} causes it.</CardDescription>
          </CardHeader>
          <CardContent>
            <RatedSymptomList
              label="Other symptoms you rated"
              symptoms={others}
              action={{
                label: (name) => `Add ${name} as a side effect of ${treatmentName}`,
                text: "Add as a side effect",
                form: (variableId) => linkSideEffectAction.bind(null, patientTreatmentId, variableId, today),
              }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

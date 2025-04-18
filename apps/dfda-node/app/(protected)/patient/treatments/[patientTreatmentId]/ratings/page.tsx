import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import Link from "next/link"
import { logger } from "@/lib/logger"
import { TreatmentDetailClient } from "../treatment-detail-client"
import { getPatientConditionsAction } from "@/app/actions/patient-conditions"
import { getPatientTreatmentDetailAction } from '@/app/actions/patient-treatments'
import { 
    Breadcrumb, 
    BreadcrumbItem, 
    BreadcrumbLink, 
    BreadcrumbList, 
    BreadcrumbPage, 
    BreadcrumbSeparator 
} from "@/components/ui/breadcrumb"

export default async function TreatmentRatingsPage({ params }: { params: Promise<{ patientTreatmentId: string }> }) {
  const { patientTreatmentId } = await params;
  logger.info(`Rendering treatment ratings page for treatment ID: ${patientTreatmentId}`);

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?message=Please log in to view treatment ratings.")
  }

  // Fetch treatment details AND patient conditions in parallel, using the new action
  const [treatmentDetails, patientConditionsResult] = await Promise.all([
      getPatientTreatmentDetailAction(patientTreatmentId, user.id),
      getPatientConditionsAction(user.id)
  ]);

  if (!treatmentDetails) {
    logger.warn(`Treatment details not found for ID: ${patientTreatmentId}`);
    notFound();
  }
  
  const patientConditions = Array.isArray(patientConditionsResult) ? patientConditionsResult : [];
  if (!Array.isArray(patientConditionsResult)) {
     logger.error("Error fetching patient conditions for dialog", { userId: user.id, error: (patientConditionsResult as any)?.error });
  }

  const treatmentName =
    treatmentDetails.global_treatments?.global_variables?.name ?? "Unknown Treatment";
  
  // Determine if there are any ratings initially
  const hasExistingRatings = treatmentDetails.treatment_ratings && treatmentDetails.treatment_ratings.length > 0;

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Breadcrumbs */}
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
            <BreadcrumbPage>Ratings</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page Header */}
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">Ratings for {treatmentName}</h2>
        <p className="text-muted-foreground">Manage effectiveness ratings for this treatment</p>
      </div>

      {/* Main Content Card */}
      <Card>
        <CardHeader>
          <CardTitle>Effectiveness Ratings</CardTitle>
          <CardDescription>Rate how effective this treatment was for specific conditions by clicking the faces.</CardDescription>
        </CardHeader>
        <CardContent>
          <TreatmentDetailClient 
            initialTreatmentDetails={treatmentDetails} 
            patientConditions={patientConditions} 
            hasExistingRatings={hasExistingRatings}
          />
        </CardContent>
      </Card>
    </div>
  );
} 
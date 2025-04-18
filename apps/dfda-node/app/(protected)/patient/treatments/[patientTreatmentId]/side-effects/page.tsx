import { createClient } from "@/lib/supabase/server"
// import type { SupabaseClient } from "@supabase/supabase-js" // Removed unused
import { redirect, notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { logger } from "@/lib/logger"
// Import the new server action
import { getPatientTreatmentDetailAction } from '@/lib/actions/patient-treatments'
// Import Breadcrumb components
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb"

// Side effects client component will be created later
import { SideEffectsClient } from "./side-effects-client"

export default async function TreatmentSideEffectsPage({ params }: { params: Promise<{ patientTreatmentId: string }> }) {
  const { patientTreatmentId } = await params;
  logger.info(`Rendering side effects page for treatment ID: ${patientTreatmentId}`);

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?message=Please log in to view treatment side effects.")
  }

  // Fetch treatment details using the new action
  const treatmentDetails = await getPatientTreatmentDetailAction(patientTreatmentId, user.id);

  if (!treatmentDetails) {
    logger.warn(`Treatment details not found for ID: ${patientTreatmentId}`);
    notFound();
  }

  const treatmentName =
    treatmentDetails.global_treatments?.global_variables?.name ?? "Unknown Treatment";
  const sideEffects = treatmentDetails.patient_side_effects || [];
  
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
            <BreadcrumbPage>Side Effects</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>



      {/* Page Header */}
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">Side Effects for {treatmentName}</h2>
        <p className="text-muted-foreground">Manage side effects for this treatment</p>
      </div>

      {/* Main Content Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle>Reported Side Effects</CardTitle>
            <CardDescription>Document any side effects you've experienced</CardDescription>
          </div>
          <div>
            <Badge variant="secondary">{sideEffects.length}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Placeholder for the client component */}
          <p className="text-sm text-muted-foreground pt-2 pb-6">
            You can use this page to track any side effects you experience while taking {treatmentName}.
            This helps you monitor your health and make informed decisions about your treatment plan.
          </p>
          
          {/* This will be replaced by the actual client component */}
          <SideEffectsClient 
            patientTreatmentId={patientTreatmentId}
            treatmentName={treatmentName}
            initialSideEffects={sideEffects}
          />
        </CardContent>
      </Card>
    </div>
  );
} 
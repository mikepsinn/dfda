import { createClient } from "@/lib/supabase/server"
import type { SupabaseClient } from "@supabase/supabase-js"
import { redirect, notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { logger } from "@/lib/logger"
import type { Database } from "@/lib/database.types"
import type { FullPatientTreatmentDetail } from "../treatment-detail-client"
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

// Reuse the fetch function from the treatment details page
async function fetchTreatmentDetails(supabase: SupabaseClient<Database>, patientTreatmentId: string, userId: string): Promise<FullPatientTreatmentDetail | null> {
    const { data, error } = await supabase
        .from("patient_treatments")
        .select(`
            *,
            treatments!inner ( global_variables!inner ( name ) ),
            treatment_ratings (
                *, 
                patient_conditions ( 
                    id,
                    conditions!inner ( global_variables!inner ( name ) ) 
                ) 
            ),
            reported_side_effects ( id, description, severity_out_of_ten )
        `)
        .eq('id', patientTreatmentId)
        .eq('patient_id', userId) 
        .single();

    if (error) {
        logger.error("Error fetching treatment details", { patientTreatmentId, userId, error: error.message });
        return null;
    }
    return data as FullPatientTreatmentDetail;
}

export default async function TreatmentSideEffectsPage({ params }: { params: Promise<{ patientTreatmentId: string }> }) {
  const { patientTreatmentId } = await params;
  logger.info(`Rendering side effects page for treatment ID: ${patientTreatmentId}`);

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?message=Please log in to view treatment side effects.")
  }

  // Fetch treatment details
  const treatmentDetails = await fetchTreatmentDetails(supabase, patientTreatmentId, user.id);

  if (!treatmentDetails) {
    logger.warn(`Treatment details not found for ID: ${patientTreatmentId}`);
    notFound();
  }

  const treatmentName = treatmentDetails.treatments?.global_variables?.name ?? "Unknown Treatment";
  const sideEffects = treatmentDetails.reported_side_effects || [];
  
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

      {/* Removed Back Link */}
      {/* 
      <Link 
        href={`/patient/treatments/${patientTreatmentId}`}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Treatment Details
      </Link>
      */}

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
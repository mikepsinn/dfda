import { createClient } from "@/lib/supabase/server"
import type { SupabaseClient } from "@supabase/supabase-js"
import { redirect, notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { logger } from "@/lib/logger"
import type { Database } from "@/lib/database.types"
import type { FullPatientTreatmentDetail } from "../treatment-detail-client"
import { TreatmentDetailClient } from "../treatment-detail-client"
import { getPatientConditionsAction } from "@/app/actions/patient-conditions"

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

export default async function TreatmentRatingsPage({ params }: { params: Promise<{ patientTreatmentId: string }> }) {
  const { patientTreatmentId } = await params;
  logger.info(`Rendering treatment ratings page for treatment ID: ${patientTreatmentId}`);

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?message=Please log in to view treatment ratings.")
  }

  // Fetch treatment details AND patient conditions in parallel
  const [treatmentDetails, patientConditionsResult] = await Promise.all([
      fetchTreatmentDetails(supabase, patientTreatmentId, user.id),
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

  const treatmentName = treatmentDetails.treatments?.global_variables?.name ?? "Unknown Treatment";
  
  // Determine if there are any ratings initially
  const hasExistingRatings = treatmentDetails.treatment_ratings && treatmentDetails.treatment_ratings.length > 0;

  return (
    <div className="container py-6 space-y-6">
      {/* Back Link */}
      <Link 
        href={`/patient/treatments/${patientTreatmentId}`}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Treatment Details
      </Link>

      {/* Page Header */}
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">{treatmentName}</h2>
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
import { createClient } from "@/lib/supabase/server"
import type { SupabaseClient } from "@supabase/supabase-js"
import { redirect, notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { logger } from "@/lib/logger"
import type { Database } from "@/lib/database.types"
import { TreatmentDetailClient, type FullPatientTreatmentDetail } from "./treatment-detail-client"
import { getPatientConditionsAction } from "@/app/actions/patient-conditions"

// Define specific types for fetched data
/* 
type PatientTreatmentDetail = 
    Database["public"]["Tables"]["patient_treatments"]["Row"] 
    & { treatments: { global_variables: { name: string } } | null }
    & { treatment_ratings: ({ 
          id: string; 
          effectiveness_out_of_ten: number | null; 
          review: string | null;
          patient_conditions: { 
              conditions: { global_variables: { name: string } } | null 
          } | null;
      })[] }
    & { reported_side_effects: ({ 
          id: string; 
          description: string; 
          severity_out_of_ten: number | null; 
      })[] };
*/

// Update fetch function to return the imported FullPatientTreatmentDetail type
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

export default async function TreatmentDetailPage({ params }: { params: Promise<{ patientTreatmentId: string }> }) {
  const { patientTreatmentId } = await params;
  console.log(`[TreatmentDetailPage] Received patientTreatmentId: ${patientTreatmentId}`);

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?message=Please log in to view treatment details.")
  }

  console.log(`[TreatmentDetailPage] Fetching data for user: ${user.id} and treatment: ${patientTreatmentId}`);
  // Fetch treatment details AND patient conditions in parallel
  const [treatmentDetails, patientConditionsResult] = await Promise.all([
      fetchTreatmentDetails(supabase, patientTreatmentId, user.id),
      getPatientConditionsAction(user.id)
  ]);
  console.log(`[TreatmentDetailPage] Fetched treatmentDetails:`, treatmentDetails ? `Found (ID: ${treatmentDetails.id})` : 'Not Found');
  console.log(`[TreatmentDetailPage] Fetched patientConditionsResult:`, patientConditionsResult);

  if (!treatmentDetails) {
    console.log(`[TreatmentDetailPage] treatmentDetails not found, rendering 404.`);
    notFound();
  }
  
  const patientConditions = Array.isArray(patientConditionsResult) ? patientConditionsResult : [];
  if (!Array.isArray(patientConditionsResult)) {
     logger.error("Error fetching patient conditions for dialog", { userId: user.id, error: (patientConditionsResult as any)?.error });
  }

  const treatmentName = treatmentDetails.treatments?.global_variables?.name ?? "Unknown Treatment";
  
  // Log the exact data being passed to the client component
  console.log("[TreatmentDetailPage] Data being passed to TreatmentDetailClient:", {
      initialTreatmentDetails: treatmentDetails, // Log the whole object
      patientConditions: patientConditions
  });

  return (
    <div className="container py-6 space-y-6">
       <Link href="/patient/treatments" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
         <ArrowLeft className="mr-2 h-4 w-4" />
         Back to Treatments
       </Link>
     
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
             <div>
               <CardTitle className="text-2xl">{treatmentName}</CardTitle>
               <CardDescription>Details for your tracked treatment.</CardDescription>
             </div>
             {treatmentDetails.status && (
                <Badge variant={treatmentDetails.status === 'active' ? 'default' : 'secondary'}>
                    {treatmentDetails.status}
                </Badge>
             )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <p className="text-muted-foreground">Start Date</p>
                    <p>{treatmentDetails.start_date ? new Date(treatmentDetails.start_date).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div>
                    <p className="text-muted-foreground">End Date</p>
                    <p>{treatmentDetails.end_date ? new Date(treatmentDetails.end_date).toLocaleDateString() : 'Ongoing'}</p>
                </div>
                <div>
                    <p className="text-muted-foreground">Prescribed?</p>
                    <p>{treatmentDetails.is_prescribed ? 'Yes' : 'No'}</p>
                </div>
            </div>
            {treatmentDetails.patient_notes && (
                 <div>
                    <p className="text-muted-foreground text-sm">Your Notes</p>
                    <p className="text-sm whitespace-pre-wrap">{treatmentDetails.patient_notes}</p>
                </div>
            )}
        </CardContent>
      </Card>

      {/* Ratings Section */}
      <Card>
         <CardHeader>
             <CardTitle>Effectiveness Ratings</CardTitle>
             <CardDescription>Rate how effective this treatment was for specific conditions by clicking the faces.</CardDescription>
         </CardHeader>
         <CardContent>
             {treatmentDetails.treatment_ratings.length > 0 ? (
                 <ul className="space-y-4">
                    {treatmentDetails.treatment_ratings.map(rating => (
                        <li key={rating.id} className="border p-4 rounded-md bg-muted/50">
                           <p className="font-medium">
                             For: {rating.patient_conditions?.conditions?.global_variables?.name ?? 'Unknown Condition'}
                           </p>
                           <p className="text-sm mt-1">
                             Rating: <span className="font-semibold">{rating.effectiveness_out_of_ten ?? 'N/A'} / 10</span>
                           </p>
                           {rating.review && (
                             <p className="text-sm text-muted-foreground mt-2 pt-2 border-t">"{rating.review}"</p>
                           )}
                        </li>
                    ))}
                 </ul>
             ) : (
                 <p className="text-muted-foreground text-center py-4">No effectiveness ratings recorded yet.</p>
             )}
             <TreatmentDetailClient 
                initialTreatmentDetails={treatmentDetails} 
                patientConditions={patientConditions} 
             />
         </CardContent>
      </Card>

      {/* Side Effects Section */}
      <Card>
          <CardHeader>
              <CardTitle>Reported Side Effects</CardTitle>
              <CardDescription>Side effects you experienced while taking this treatment.</CardDescription>
          </CardHeader>
          <CardContent>
              {treatmentDetails.reported_side_effects.length > 0 ? (
                  <ul className="space-y-3">
                      {treatmentDetails.reported_side_effects.map(effect => (
                          <li key={effect.id} className="border p-3 rounded-md bg-muted/50 flex justify-between items-start">
                              <p className="text-sm flex-grow mr-4">{effect.description}</p>
                              {effect.severity_out_of_ten !== null && (
                                  <Badge variant="secondary">Severity: {effect.severity_out_of_ten}/10</Badge>
                              )}
                          </li>
                      ))}
                  </ul>
              ) : (
                  <p className="text-muted-foreground text-center py-4">No side effects recorded yet.</p>
              )}
          </CardContent>
      </Card>

    </div>
  )
}

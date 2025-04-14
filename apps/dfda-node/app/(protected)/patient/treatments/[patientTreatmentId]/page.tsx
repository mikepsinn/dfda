import { createClient } from "@/lib/supabase/server"
import type { SupabaseClient } from "@supabase/supabase-js"
import { redirect, notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { logger } from "@/lib/logger"
import type { Database } from "@/lib/database.types"
import { TreatmentDetailClient } from "./treatment-detail-client"
import { getPatientConditionsAction } from "@/app/actions/patient-conditions"

// Type for PatientCondition (can share or redefine)
type PatientCondition = Database["public"]["Views"]["patient_conditions_view"]["Row"];

// Define specific types for fetched data
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

async function fetchTreatmentDetails(supabase: SupabaseClient<Database>, patientTreatmentId: string, userId: string): Promise<PatientTreatmentDetail | null> {
    const { data, error } = await supabase
        .from("patient_treatments")
        .select(`
            *,
            treatments!inner ( global_variables!inner ( name ) ),
            treatment_ratings (
                id, 
                effectiveness_out_of_ten, 
                review, 
                patient_conditions ( 
                    conditions!inner ( global_variables!inner ( name ) ) 
                ) 
            ),
            reported_side_effects ( id, description, severity_out_of_ten )
        `)
        .eq('id', patientTreatmentId)
        .eq('patient_id', userId) // Ensure user owns this record
        .single();

    if (error) {
        logger.error("Error fetching treatment details", { patientTreatmentId, userId, error: error.message });
        return null; // Let the calling function handle notFound
    }

    // Type assertion after successful fetch
    return data as PatientTreatmentDetail;
}

export default async function TreatmentDetailPage({ 
    params: { patientTreatmentId } 
}: { 
    params: { patientTreatmentId: string } 
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?message=Please log in to view treatment details.")
  }

  // Fetch treatment details AND patient conditions in parallel
  const [treatmentDetails, patientConditionsResult] = await Promise.all([
      fetchTreatmentDetails(supabase, patientTreatmentId, user.id),
      getPatientConditionsAction(user.id) // Fetch conditions needed by the dialog
  ]);

  if (!treatmentDetails) {
    notFound(); // Show 404 if treatment not found or doesn't belong to user
  }
  
  // Handle potential error fetching conditions (optional, could show message)
   const patientConditions = Array.isArray(patientConditionsResult) ? patientConditionsResult : [];
   if (!Array.isArray(patientConditionsResult)) {
      logger.error("Error fetching patient conditions for dialog", { userId: user.id, error: (patientConditionsResult as any)?.error });
      // Decide how to proceed - maybe disable rating button? For now, pass empty array.
   }

  const treatmentName = treatmentDetails.treatments?.global_variables?.name ?? "Unknown Treatment";
  
  // Prepare the simplified treatment summary for the client component
  // Pass necessary fields that TreatmentRatingDialog might indirectly need via its props
  const treatmentSummary = {
      id: treatmentDetails.id,
      treatment_name: treatmentName
      // Add other fields from treatmentDetails if the dialog component requires them
      // status: treatmentDetails.status, 
  };

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
             <CardDescription>How effective this treatment was for specific conditions.</CardDescription>
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
         </CardContent>
         <TreatmentDetailClient 
            patientTreatment={treatmentSummary}
            patientConditions={patientConditions} 
         />
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

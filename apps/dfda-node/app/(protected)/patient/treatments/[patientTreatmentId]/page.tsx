import { createClient } from "@/lib/supabase/server"
// import type { SupabaseClient } from "@supabase/supabase-js" // Removed unused import
import { redirect, notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, AlertCircle, Bell } from "lucide-react"
import Link from "next/link"
import { logger } from "@/lib/logger"
// import type { Database } from "@/lib/database.types" // Removed unused import
// import { TreatmentDetailClient, type FullPatientTreatmentDetail } from "./treatment-detail-client"
// import type { FullPatientTreatmentDetail } from "./treatment-detail-client" // Removed unused import
import { getPatientConditionsAction } from "@/lib/actions/patient-conditions"
import { getPatientTreatmentDetailAction } from '@/lib/actions/patient-treatments'
import { Button } from '@/components/ui/button'
// Import Breadcrumb components
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb"
// import { fetchPatientTreatmentById } from "@/app/actions/patient-treatments" // Removed incorrect import


export default async function TreatmentDetailPage({ params }: { params: Promise<{ patientTreatmentId: string }> }) {
  const { patientTreatmentId } = await params;
  console.log(`[TreatmentDetailPage] Received patientTreatmentId: ${patientTreatmentId}`);

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?message=Please log in to view treatment details.")
  }

  console.log(`[TreatmentDetailPage] Fetching data for user: ${user.id} and treatment: ${patientTreatmentId}`);
  // Fetch treatment details AND patient conditions in parallel, using the new action
  const [treatmentDetails, patientConditionsResult] = await Promise.all([
      getPatientTreatmentDetailAction(patientTreatmentId, user.id),
      getPatientConditionsAction(user.id)
  ]);
  console.log(`[TreatmentDetailPage] Fetched treatmentDetails:`, treatmentDetails ? `Found (ID: ${treatmentDetails.id})` : 'Not Found');
  console.log(`[TreatmentDetailPage] Fetched patientConditionsResult:`, patientConditionsResult);

  if (!treatmentDetails) {
    console.log(`[TreatmentDetailPage] treatmentDetails not found, rendering 404.`);
    notFound();
  }
  
  if (!Array.isArray(patientConditionsResult)) {
     logger.error("Error fetching patient conditions for dialog", { userId: user.id, error: (patientConditionsResult as any)?.error });
  }

  const treatmentName =
    treatmentDetails.global_treatments?.global_variables?.name ?? "Unknown Treatment";
  
  // Count for badges
  const ratingsCount = treatmentDetails.treatment_ratings.length;
  const sideEffectsCount = treatmentDetails.patient_side_effects.length;

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
            <BreadcrumbPage>{treatmentName}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

       {/* Removed Back Button - Breadcrumbs handle this now */}
       {/* 
       <Link href="/patient/treatments" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
         <ArrowLeft className="mr-2 h-4 w-4" />
         Back to Treatments
       </Link>
       */}
     
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

      {/* Ratings Section - Replaced with navigation button card */}
      <Card>
        <CardHeader>
          <CardTitle>Effectiveness Ratings</CardTitle>
          <CardDescription>Rate how effective this treatment was for specific conditions.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div>
              {ratingsCount > 0 ? (
                <p className="text-sm mb-4">You have provided {ratingsCount} rating{ratingsCount !== 1 ? 's' : ''} for this treatment.</p>
              ) : (
                <p className="text-sm text-muted-foreground mb-4">No effectiveness ratings recorded yet.</p>
              )}
            </div>
            <Badge variant="secondary" className="ml-auto">{ratingsCount}</Badge>
          </div>
          
          <Button asChild className="w-full" variant="outline">
            <Link href={`/patient/treatments/${patientTreatmentId}/ratings`}>
              <Star className="mr-2 h-4 w-4" />
              View & Manage Ratings
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Side Effects Section - Replaced with navigation button card */}
      <Card>
        <CardHeader>
          <CardTitle>Reported Side Effects</CardTitle>
          <CardDescription>Side effects you experienced while taking this treatment.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div>
              {sideEffectsCount > 0 ? (
                <p className="text-sm mb-4">You have reported {sideEffectsCount} side effect{sideEffectsCount !== 1 ? 's' : ''} for this treatment.</p>
              ) : (
                <p className="text-sm text-muted-foreground mb-4">No side effects recorded yet.</p>
              )}
            </div>
            <Badge variant="secondary" className="ml-auto">{sideEffectsCount}</Badge>
          </div>
          
          <Button asChild className="w-full" variant="outline">
            <Link href={`/patient/treatments/${patientTreatmentId}/side-effects`}>
              <AlertCircle className="mr-2 h-4 w-4" />
              View & Manage Side Effects
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Reminder Schedule Section - Updated with consistent styling */}
      <Card>
        <CardHeader>
          <CardTitle>Reminder Schedule</CardTitle>
          <CardDescription>Manage reminders for taking this treatment.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Set up and manage reminders for taking this treatment.
          </p>
          
          <Button asChild className="w-full" variant="outline">
            <Link href={`/patient/reminders/${treatmentDetails.user_variable_id}`}>
              <Bell className="mr-2 h-4 w-4" />
              View & Manage Schedule
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

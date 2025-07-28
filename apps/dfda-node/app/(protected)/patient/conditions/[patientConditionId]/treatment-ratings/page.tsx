import { getServerUser } from "@/lib/server-auth"
import { redirect } from "next/navigation"
import { getPatientConditionByIdAction } from "@/lib/actions/patient-conditions" // Action to get specific PC
import { getRatingsForPatientConditionAction } from "@/lib/actions/treatment-ratings" // Action to get ratings
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link" // Import Link
import { notFound } from 'next/navigation'
import { Suspense } from "react"
import { createLogger } from "@/lib/logger"
import { Star } from "lucide-react"

// Import Breadcrumb components
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb"



// Import List Components
import { RatingsList } from "../components/ratings-list"
import { RateTreatmentDialog } from "../components/rate-treatment-dialog"

const logger = createLogger("patient-condition-detail-page")


// Destructure params directly in the signature
export default async function PatientConditionDetailPage({ params }: { params: Promise<{ patientConditionId: string }> }) {
  // Await params before accessing its properties
  const { patientConditionId } = await params;
  
  const user = await getServerUser()
  if (!user) {
    redirect("/login")
  }

  // Use the awaited patientConditionId
  logger.info("Loading patient condition detail page", { userId: user.id, patientConditionId });

  // Fetch the specific patient condition record using the awaited ID
  const condition = await getPatientConditionByIdAction(patientConditionId);

  // If condition not found or doesn't belong to user (assuming RLS handles user check), show 404
  if (!condition || condition.patient_id !== user.id) {
     logger.warn("Patient condition not found or access denied", { userId: user.id, patientConditionId });
     notFound();
  }

  // Fetch associated ratings for this patient condition
  const conditionRatings = await getRatingsForPatientConditionAction(patientConditionId);


  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/patient/conditions">Conditions</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{condition.condition_name || "Condition Details"}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>


      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Header Card - Spans both columns on large screens */}

        {/* Condition Ratings Card */}
        <Card>
           <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Treatment Ratings</CardTitle>
                <CardDescription>How effective have treatments been specifically for {condition.condition_name || "this condition"}?</CardDescription>
              </div>
               <RateTreatmentDialog patientCondition={condition}>
                 <Button variant="outline">
                   <Star className="mr-2 h-4 w-4"/> Rate Treatment
                 </Button>
               </RateTreatmentDialog>
            </CardHeader>
            <CardContent>
                <Suspense fallback={<p className="text-muted-foreground">Loading ratings...</p>}> 
                   <RatingsList ratings={conditionRatings} patientCondition={condition} /> 
                </Suspense>
            </CardContent>
        </Card>



      </div>
    </div>
  )
}

// Force dynamic rendering for this page as it depends on params
export const dynamic = 'force-dynamic' 
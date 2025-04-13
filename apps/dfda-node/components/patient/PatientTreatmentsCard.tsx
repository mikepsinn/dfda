"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StarRating } from "@/components/ui/star-rating" // Assuming star rating component exists
import { Pencil, MessageSquareWarning } from "lucide-react"

// Define the expected prop structure based on data from patient/page.tsx
interface TreatmentData {
  id: string; // Treatment ID
  name: string;
  description: string | null;
  effectiveness_out_of_ten: number | null;
}

interface PatientTreatmentsCardProps {
  treatment: TreatmentData;
  conditionId: string; // patient_condition_id is needed for linking
  conditionName?: string; // Optional: Display which condition this is for
}

export function PatientTreatmentsCard({ treatment, conditionId, conditionName }: PatientTreatmentsCardProps) {
  // Link to the public treatment page, passing the patient_condition_id
  const treatmentDetailUrl = `/treatments/${treatment.id}?condition=${conditionId}`
  // Placeholder for links - adjust paths as needed
  const rateTreatmentUrl = `/patient/rate/treatment/${treatment.id}?condition=${conditionId}` // Example path
  const logSideEffectUrl = `/patient/log/side-effect?treatment=${treatment.id}` // Example path

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex justify-between items-start gap-2">
          <div>
            <Link href={treatmentDetailUrl}>
               <CardTitle className="text-lg hover:underline cursor-pointer">{treatment.name}</CardTitle>
            </Link>
            {conditionName && (
               <CardDescription>For: {conditionName}</CardDescription>
            )}
          </div>
           {/* Display Rating */}
           {treatment.effectiveness_out_of_ten !== null && treatment.effectiveness_out_of_ten >= 0 ? (
              <div className="text-right flex-shrink-0">
                 <div className="font-semibold">Effectiveness</div>
                 <StarRating rating={treatment.effectiveness_out_of_ten} readOnly size="sm" />
                 <div className="text-xs text-muted-foreground">({treatment.effectiveness_out_of_ten}/10)</div>
              </div>
            ) : (
              <div className="text-right flex-shrink-0 text-sm text-muted-foreground">Not Rated</div>
            )}
        </div>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        {treatment.description && (
          <p className="mb-4 line-clamp-2">{treatment.description}</p>
        )}
        {/* Action Buttons */} 
        <div className="flex items-center justify-end gap-2 mt-2">
           <Link href={rateTreatmentUrl}>
             <Button variant="outline" size="sm">
                <Pencil className="mr-1 h-3 w-3" /> Rate / Review
             </Button>
           </Link>
           <Link href={logSideEffectUrl}>
             <Button variant="outline" size="sm">
               <MessageSquareWarning className="mr-1 h-3 w-3" /> Log Side Effect
             </Button>
           </Link>
        </div>
      </CardContent>
    </Card>
  )
} 
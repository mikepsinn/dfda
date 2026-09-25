'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
// import { Badge } from "@/components/ui/badge" // Removed unused import
import type { FullPatientTreatmentDetail } from "./treatment-detail-client" // Assuming type definition is here
import { TreatmentDetailClient } from "./treatment-detail-client" 
import type { PatientCondition } from '@/lib/actions/patient-conditions'; // Assuming type location

interface TreatmentRatingsCardProps {
  treatmentDetails: FullPatientTreatmentDetail;
  patientConditions: PatientCondition[]; // Use the imported type
}

export function TreatmentRatingsCard({ treatmentDetails, patientConditions }: TreatmentRatingsCardProps) {
  // Determine if there are any ratings initially
  const hasExistingRatings = treatmentDetails.treatment_ratings && treatmentDetails.treatment_ratings.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Effectiveness Ratings</CardTitle>
        <CardDescription>Rate how effective this treatment was for specific conditions by clicking the faces.</CardDescription>
      </CardHeader>
      <CardContent>
        {/* No empty state needed here anymore - handled by TreatmentDetailClient */}
        
        {/* 
          The TreatmentDetailClient now handles rendering the list of editable ratings
          OR the empty state message, AND the button to add/edit.
        */}
        <TreatmentDetailClient 
          initialTreatmentDetails={treatmentDetails} 
          patientConditions={patientConditions} 
          hasExistingRatings={hasExistingRatings} // Pass the flag
        />
      </CardContent>
    </Card>
  )
} 
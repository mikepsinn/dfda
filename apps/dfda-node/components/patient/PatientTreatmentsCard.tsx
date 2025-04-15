"use client"

import Link from "next/link"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import type { PatientTreatmentWithName } from "@/app/actions/patient-treatments"

interface PatientTreatmentsCardProps {
  patientTreatment: PatientTreatmentWithName;
}

export function PatientTreatmentsCard({ patientTreatment }: PatientTreatmentsCardProps) {
  const treatmentName = patientTreatment.treatments?.global_variables?.name || "Unnamed Treatment";
  const treatmentId = patientTreatment.treatment_id;

  const treatmentDetailUrl = `/treatments/${treatmentId}`;
  const rateTreatmentUrl = `/patient/rate/treatment/${treatmentId}`;
  const logSideEffectUrl = `/patient/log/side-effect?treatment=${treatmentId}`;

  return (
    <Link href={treatmentDetailUrl} className="block">
      <Card className="hover:bg-muted/50 cursor-pointer transition-colors">
        <CardHeader>
          <div className="flex justify-between items-start gap-2">
            <div>
              <CardTitle className="text-lg">{treatmentName}</CardTitle>
            </div>
          </div>
        </CardHeader>
      </Card>
    </Link>
  )
} 
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation' // Import useRouter for refresh
import { Button } from "@/components/ui/button"
import { Edit } from "lucide-react"
// Adjust the path to the actual location of TreatmentRatingDialog
// It was likely in ./../components/treatment-rating-dialog.tsx relative to the page
import { TreatmentRatingDialog } from "../components/treatment-rating-dialog"
import type { Database } from "@/lib/database.types"

// Type for the necessary parts of treatment details passed from server
// This needs to match what TreatmentRatingDialog actually expects for its patientTreatment prop.
// Let's assume it needs at least id and treatment_name.
// If it needs more fields from the patient_treatments table, add them here and pass from the server page.
type TreatmentSummary = Pick<Database["public"]["Tables"]["patient_treatments"]["Row"], "id"> & {
    treatment_name: string;
};

// Type for patient conditions passed from server
type PatientCondition = Database["public"]["Views"]["patient_conditions_view"]["Row"];

interface TreatmentDetailClientProps {
    patientTreatment: TreatmentSummary;
    patientConditions: PatientCondition[];
}

export function TreatmentDetailClient({ 
    patientTreatment, 
    patientConditions 
}: TreatmentDetailClientProps) {
    
    const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false);
    const router = useRouter(); // Initialize router

    const handleRatingSuccess = () => {
        console.log("Rating success, refreshing page data...");
        // Refresh server-side props and re-render Server Components
        router.refresh(); 
        // Optionally close dialog if not closed automatically by itself on success
        // setIsRatingDialogOpen(false); 
    };

    // Ensure patientConditions are valid before rendering dialog
    const validPatientConditions = Array.isArray(patientConditions) ? patientConditions : [];

    // Prepare the prop for TreatmentRatingDialog.
    // It needs the full structure expected by its props, including nested treatment_name
    const dialogPatientTreatmentProp = {
        ...patientTreatment, // includes id 
        treatment_name: patientTreatment.treatment_name // explicitly add treatment_name
        // Add any other required fields from patient_treatments table if necessary
        // Example: status: patientTreatment.status // if status was passed in TreatmentSummary
    };

    return (
        <>
            {/* Button to trigger the dialog */}
            <div className="flex justify-center border-t pt-4 mt-4"> 
                 <Button variant="outline" onClick={() => setIsRatingDialogOpen(true)}>
                     <Edit className="mr-2 h-4 w-4"/>Add/Edit Rating
                 </Button>
             </div>

            {/* The Dialog component itself */}
            <TreatmentRatingDialog
                open={isRatingDialogOpen}
                onOpenChange={setIsRatingDialogOpen}
                // Pass the correctly structured prop
                patientTreatment={dialogPatientTreatmentProp}
                patientConditions={validPatientConditions}
                onSuccess={handleRatingSuccess} // Use router refresh on success
            />
        </>
    );
} 
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation' // Import useRouter for refresh
import { Button } from "@/components/ui/button"
import { Edit } from "lucide-react"
import { useToast } from "@/components/ui/use-toast" // Import useToast
// Adjust the path to the actual location of TreatmentRatingDialog
// It was likely in ./../components/treatment-rating-dialog.tsx relative to the page
import { TreatmentRatingDialog } from "../components/treatment-rating-dialog"
import { FaceRatingInput } from '@/components/face-rating-input' // Import FaceRatingInput
import { upsertTreatmentRatingAction } from '@/lib/actions/treatment-ratings' // Import action
import type { TreatmentRating, TreatmentRatingUpsertData } from '@/lib/actions/treatment-ratings' // Import types
import type { Database } from "@/lib/database.types"

// Export the type for the full treatment details
export type FullPatientTreatmentDetail = 
    Database["public"]["Tables"]["patient_treatments"]["Row"] 
    & { global_treatments: { global_variables: { name: string } } | null }
    & { treatment_ratings: (TreatmentRating & { // Use imported TreatmentRating type
          patient_conditions: { 
              global_conditions: { global_variables: { name: string } } | null 
          } | null;
      })[] }
    & { patient_side_effects: ({ 
          id: string; 
          description: string; 
          severity_out_of_ten: number | null; 
      })[] };

// Type for patient conditions passed from server
type PatientCondition = Database["public"]["Views"]["patient_conditions_view"]["Row"];

interface TreatmentDetailClientProps {
    // Expect the full details now, not just summary
    initialTreatmentDetails: FullPatientTreatmentDetail; 
    patientConditions: PatientCondition[];
    hasExistingRatings: boolean;
}

// Define state structure for editable ratings
interface EditableRatingState { 
    // Keyed by patient_condition_id (since a treatment can be rated for multiple conditions)
    [patientConditionId: string]: { 
        currentValue: string; // e.g., "5", "7.5"
        isSaving: boolean;
        conditionName: string;
        ratingId: string | undefined; // Store existing rating ID if available
    }
}

// Re-use or redefine rating options to map values to emojis
const ratingOptionsMap: { [key: string]: string } = { 
    '0': '😭',
    '2.5': '😟',
    '5': '😐',
    '7.5': '😊',
    '10': '😁',
};

const getEmojiForRating = (ratingValue: string | null | undefined): string => {
    if (ratingValue === null || ratingValue === undefined || ratingValue === "") {
        return ""; // Or a default placeholder like '❔'
    }
    return ratingOptionsMap[ratingValue] || ""; // Return emoji or empty string if no match
}

export function TreatmentDetailClient({ 
    initialTreatmentDetails, 
    patientConditions, 
    hasExistingRatings
}: TreatmentDetailClientProps) {
    
    // Move hooks to the top level
    const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false);
    const [editableRatings, setEditableRatings] = useState<EditableRatingState>({}); 
    const router = useRouter(); 
    const { toast } = useToast();

    // Initialize editable ratings state from initial props
    useEffect(() => {
        // The effect's logic can still depend on initialTreatmentDetails
        if (!initialTreatmentDetails) {
            console.log("[TreatmentDetailClient] useEffect skipped: initialTreatmentDetails not available yet.");
            setEditableRatings({}); // Ensure state is cleared or set to default if details missing
            return; 
        }
        // Log the received ratings array
        console.log("[TreatmentDetailClient] useEffect received initialTreatmentDetails.treatment_ratings:", initialTreatmentDetails.treatment_ratings);

        const initialRatingsState: EditableRatingState = {};
        if (Array.isArray(initialTreatmentDetails.treatment_ratings)) {
            initialTreatmentDetails.treatment_ratings.forEach(rating => {
                 if (rating.patient_condition_id) { 
                    initialRatingsState[rating.patient_condition_id] = {
                        ratingId: rating.id, 
                        currentValue: rating.effectiveness_out_of_ten?.toString() ?? "",
                        isSaving: false,
                        conditionName: rating.patient_conditions?.global_conditions?.global_variables?.name ?? 'Unknown Condition',
                    };
                 } else {
                    console.warn("[TreatmentDetailClient] Rating found without patient_condition_id:", rating);
                 }
            });
        } else {
             console.warn("[TreatmentDetailClient] initialTreatmentDetails.treatment_ratings is not an array or is undefined.");
        }

        console.log("[TreatmentDetailClient] Setting editable ratings state:", initialRatingsState);
        setEditableRatings(initialRatingsState);
    }, [initialTreatmentDetails]);

    // If the initial data hasn't arrived yet, don't render anything or show loading
    // Keep this check *after* the hooks
    if (!initialTreatmentDetails) {
        console.log("[TreatmentDetailClient] Rendering null because initialTreatmentDetails is missing.");
        return null; // Or return a loading skeleton/spinner
    }

    const handleRatingSuccess = () => {
        console.log("[TreatmentDetailClient] Dialog Rating success, refreshing page data...");
        router.refresh(); 
    };

    // Function to handle clicks on the inline face ratings
    const handleInlineRatingChange = async (patientConditionId: string, newValue: string) => {
        const ratingState = editableRatings[patientConditionId];
        if (!ratingState || ratingState.isSaving || ratingState.currentValue === newValue) {
             console.log("[TreatmentDetailClient] Skipping inline rating update", { patientConditionId, newValue, ratingState });
            return; // Avoid unnecessary updates or updates while saving
        }

        // Optimistically update local state
        console.log(`[TreatmentDetailClient] Optimistically updating rating for condition ${patientConditionId} to ${newValue}`);
        setEditableRatings(prev => ({
            ...prev,
            [patientConditionId]: { ...prev[patientConditionId], currentValue: newValue, isSaving: true }
        }));

        try {
            const ratingValue = parseFloat(newValue);
             if (isNaN(ratingValue)) {
                throw new Error("Invalid rating value selected.");
             }

            const ratingData: TreatmentRatingUpsertData = {
                // Remove ID - upsert handles based on composite key
                // id: ratingState.ratingId || undefined,
                patient_treatment_id: initialTreatmentDetails.id, // ID of the current treatment
                patient_condition_id: patientConditionId, // Condition ID is the key
                effectiveness_out_of_ten: ratingValue,
                // Review is not updated here
            };

            console.log("[TreatmentDetailClient] Calling upsertTreatmentRatingAction for inline change:", ratingData);
            const result = await upsertTreatmentRatingAction(ratingData);

            if (!result.success) {
                throw new Error(result.error || "Failed to save rating.");
            }

            toast({ title: "Rating Updated", description: `Effectiveness for ${ratingState.conditionName} saved.` });
            
            // Update state: mark as not saving and potentially update the ratingId if it was a new insert
            const finalRatingId = result.data?.id ?? ratingState.ratingId; // Use returned ID if available
            console.log(`[TreatmentDetailClient] Inline rating saved successfully for ${patientConditionId}. New/Existing Rating ID: ${finalRatingId}`);
            setEditableRatings(prev => ({
                ...prev,
                [patientConditionId]: { 
                    ...prev[patientConditionId], 
                    isSaving: false, 
                    ratingId: finalRatingId // Update rating ID in state
                }
            }));
            // No need to refresh page data, local state is source of truth for input now
            // router.refresh(); 

        } catch (error: any) {
             console.error("[TreatmentDetailClient] Failed to save inline rating:", error);
             toast({ title: "Error Saving Rating", description: error.message, variant: "destructive" });
             // Revert optimistic update on error
             setEditableRatings(prev => ({
                 ...prev,
                 [patientConditionId]: { ...prev[patientConditionId], currentValue: ratingState.currentValue, isSaving: false } // Revert value
             }));
        }
    };

    // This code below will now only run if initialTreatmentDetails is defined
    const validPatientConditions = Array.isArray(patientConditions) ? patientConditions : [];

    const dialogPatientTreatmentProp = {
        ...initialTreatmentDetails, // Pass the full initial object
        treatment_name: initialTreatmentDetails.global_treatments?.global_variables?.name ?? 'Unknown Treatment'
    };

    // Log the state right before rendering
    console.log("[TreatmentDetailClient] Rendering with editableRatings state:", editableRatings);

    return (
        <>
            {/* Render the editable ratings using FaceRatingInput */} 
            {Object.keys(editableRatings).length > 0 ? (
                 <div className="space-y-4">
                    {Object.entries(editableRatings).map(([patientConditionId, ratingState]) => {
                        const emoji = getEmojiForRating(ratingState.currentValue);
                        return (
                            <div key={patientConditionId} className="border p-4 rounded-md bg-muted/50 space-y-2">
                                <p className="font-medium text-sm flex items-center"> {/* Use flex to align emoji and text */} 
                                    {emoji && <span className="text-xl mr-2">{emoji}</span>} {/* Display emoji */} 
                                    For: {ratingState.conditionName}
                                </p>
                                <FaceRatingInput
                                    value={ratingState.currentValue}
                                    onValueChange={(newValue) => handleInlineRatingChange(patientConditionId, newValue)}
                                    disabled={ratingState.isSaving}
                                    labelId={`rating-label-${patientConditionId}`} // Unique label ID
                                />
                            </div>
                        )
                    })}
                 </div>
             ) : (
                 <p className="text-muted-foreground text-center py-4">No effectiveness ratings recorded yet.</p>
             )}

            {/* Button to trigger the dialog for adding NEW ratings */}
            <div className="flex justify-center border-t pt-4 mt-4"> 
                 <Button variant="outline" onClick={() => setIsRatingDialogOpen(true)}>
                     <Edit className="mr-2 h-4 w-4"/>
                     {hasExistingRatings ? "Rate for Another Condition" : "Add First Rating"}
                 </Button>
             </div>

            {/* The Dialog component itself (now primarily for adding ratings for *new* conditions) */} 
            <TreatmentRatingDialog
                open={isRatingDialogOpen}
                onOpenChange={setIsRatingDialogOpen}
                patientTreatment={dialogPatientTreatmentProp} // Pass full details
                patientConditions={validPatientConditions}
                onSuccess={handleRatingSuccess} // Refreshes server data on dialog success
            />
        </>
    );
} 
'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { ConditionCombobox } from "@/components/condition-combobox"
import { createLogger } from '@/lib/logger'
import type { Database } from '@/lib/database.types'
import { getRatingForPatientTreatmentPatientConditionAction, upsertTreatmentRatingAction } from '@/lib/actions/treatment-ratings'
import type { TreatmentRating, TreatmentRatingUpsertData } from '@/lib/actions/treatment-ratings'
import { FaceRatingInput } from '@/components/face-rating-input'

const logger = createLogger('treatment-rating-dialog')

// Types from props or fetched
type PatientCondition = Database["public"]["Views"]["patient_conditions_view"]["Row"];
type PatientTreatment = Database["public"]["Tables"]["patient_treatments"]["Row"];

interface TreatmentRatingDialogProps {
  patientTreatment: PatientTreatment & { treatment_name: string }; // Pass the full patient treatment object
  patientConditions: PatientCondition[]; // Pass the list of patient's conditions
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void; // Optional callback after successful submission
}

export function TreatmentRatingDialog({ 
  patientTreatment, 
  patientConditions,
  open, 
  onOpenChange,
  onSuccess 
}: TreatmentRatingDialogProps) {
  const [selectedPatientConditionId, setSelectedPatientConditionId] = useState<string>("");
  const [rating, setRating] = useState<string>(""); // Store as string for Select component
  const [review, setReview] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingExisting, setIsFetchingExisting] = useState(false);
  const [existingRating, setExistingRating] = useState<TreatmentRating | null>(null);
  const { toast } = useToast();

  // Fetch existing rating when patient condition selection changes
  useEffect(() => {
    if (open && patientTreatment.id && selectedPatientConditionId && selectedPatientConditionId !== 'not-specified') {
      const fetchExistingRating = async () => {
        setIsFetchingExisting(true);
        setExistingRating(null); // Clear previous rating
        setRating(""); // Reset form fields
        setReview("");
        logger.info('Fetching existing rating', { patientTreatmentId: patientTreatment.id, selectedPatientConditionId });
        try {
          const fetchedRating = await getRatingForPatientTreatmentPatientConditionAction(patientTreatment.id, selectedPatientConditionId);
          if (fetchedRating) {
            setExistingRating(fetchedRating);
            setRating(fetchedRating.effectiveness_out_of_ten?.toString() ?? "");
            setReview(fetchedRating.review ?? "");
            logger.info('Found existing rating', { ratingId: fetchedRating.id });
          } else {
              logger.info('No existing rating found for this patient condition');
          }
        } catch (error: any) {
          logger.error('Error fetching existing rating', { patientTreatmentId: patientTreatment.id, selectedPatientConditionId, error: error.message });
          toast({ title: "Error", description: "Could not load existing rating details.", variant: "destructive" });
        } finally {
          setIsFetchingExisting(false);
        }
      };
      fetchExistingRating();
    } else {
        // Reset if condition is not selected or dialog closed
        setExistingRating(null);
        setRating("");
        setReview("");
    }
  }, [open, patientTreatment.id, selectedPatientConditionId, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientConditionId || selectedPatientConditionId === 'not-specified') {
        toast({ title: "Missing Condition", description: "Please select the condition you are rating this treatment for.", variant: "destructive" });
        return;
    }
     if (!rating) {
        toast({ title: "Missing Rating", description: "Please select an effectiveness rating using the faces.", variant: "destructive" });
        return;
    }
    
    setIsLoading(true);
    const ratingValue = parseFloat(rating);
    if (isNaN(ratingValue)) {
        logger.error('Invalid rating value before submit', { ratingState: rating });
        toast({ title: "Invalid Rating", description: "Selected rating is invalid.", variant: "destructive" });
        setIsLoading(false);
        return;
    }
    logger.info('Submitting rating', { patientTreatmentId: patientTreatment.id, patientConditionId: selectedPatientConditionId, rating: ratingValue });

    try {
       const ratingData: TreatmentRatingUpsertData = {
         patient_treatment_id: patientTreatment.id,
         patient_condition_id: selectedPatientConditionId,
         effectiveness_out_of_ten: ratingValue,
         review: review || null,
       };

      const result = await upsertTreatmentRatingAction(ratingData);

      if (result.success) {
        toast({ title: "Success", description: "Rating saved successfully." });
        if (onSuccess) onSuccess(); // Call success callback if provided
        onOpenChange(false); // Close dialog on success
      } else {
        throw new Error(result.error || "Failed to save rating.");
      }

    } catch (error: any) {
      logger.error('Error saving rating', { 
          patientTreatmentId: patientTreatment.id, 
          patientConditionId: selectedPatientConditionId,
          error: error.message 
      });
      toast({ title: "Error", description: error.message || "Failed to save rating.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form state if dialog is closed without submitting
  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) {
      setSelectedPatientConditionId("");
      setRating("");
      setReview("");
      setExistingRating(null);
      setIsLoading(false);
      setIsFetchingExisting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Rate Effectiveness of {patientTreatment.treatment_name}</DialogTitle>
          <DialogDescription>
            How effective was this treatment for a specific condition during this period?
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* Condition Selection */} 
           <div className="grid gap-2">
              <Label htmlFor="condition">Condition Being Treated <span className="text-red-500">*</span></Label>
              <ConditionCombobox
                patientConditions={patientConditions} // Pass conditions from props
                value={selectedPatientConditionId}
                onValueChange={setSelectedPatientConditionId} 
                // Make sure this combobox allows selecting ONLY existing patient conditions
              />
            </div>

          {/* Rating and Review (Show only if condition selected) */} 
          {selectedPatientConditionId && selectedPatientConditionId !== 'not-specified' && (
            <>
               {isFetchingExisting && <p className="text-sm text-muted-foreground">Loading existing rating...</p>}
               {!isFetchingExisting && (
                   <>
                    {/* === Use FaceRatingInput Component === */}
                    <div className="grid gap-1"> {/* Wrap in div for consistent spacing */} 
                      <Label id="effectiveness-label" className="text-sm font-medium">Effectiveness Rating <span className="text-red-500">*</span></Label>
                      <p className="text-xs text-muted-foreground">Click a face to indicate how much this treatment improved your condition.</p>
                      <FaceRatingInput 
                          labelId="effectiveness-label" 
                          value={rating} 
                          onValueChange={setRating} // Directly update state
                      />
                    </div>
                    {/* === End FaceRatingInput Component === */} 

                    {/* Review Text */} 
                    <div className="grid gap-2">
                        <Label htmlFor="review">Review (Optional)</Label>
                        <Textarea
                        id="review"
                        value={review}
                        onChange={(e) => setReview(e.target.value)}
                        placeholder="Share your experience with this treatment for the selected condition..."
                        className="mt-1 min-h-[80px]"
                        />
                    </div>
                   </>
               )}
            </>
          )}

          <DialogFooter>
             <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button 
              type="submit" 
              disabled={isLoading || isFetchingExisting || !selectedPatientConditionId || selectedPatientConditionId === 'not-specified' || !rating}
            >
              {isLoading ? "Saving..." : (existingRating ? "Update Rating" : "Save Rating")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 
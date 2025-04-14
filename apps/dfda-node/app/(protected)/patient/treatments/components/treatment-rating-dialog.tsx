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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ConditionCombobox } from "@/components/condition-combobox"
import { createLogger } from '@/lib/logger'
import type { Database } from '@/lib/database.types'
// Import the updated server actions
import { getRatingForPatientTreatmentPatientConditionAction, upsertTreatmentRatingAction } from '@/app/actions/treatment-ratings'
import type { TreatmentRating, TreatmentRatingUpsertData } from '@/app/actions/treatment-ratings'

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
        toast({ title: "Missing Rating", description: "Please select an effectiveness rating (0-10).", variant: "destructive" });
        return;
    }
    
    setIsLoading(true);
    const ratingValue = parseInt(rating, 10);
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
                    {/* Effectiveness Rating */} 
                    <div className="grid gap-2">
                        <Label htmlFor="effectiveness">How much imporovement?<span className="text-red-500">*</span></Label>
                         <p className="text-xs text-muted-foreground">Click a face to indicate how much you think this treatment improved your condition</p>
                         {/* Face Rating Component - 5 Faces */}
                         <div className="flex justify-between items-end pt-2 space-x-1 px-2"> {/* Use justify-between and add some padding */}
                            {[ 
                              { emoji: '😭', value: '0', label: 'No Improvement' },
                              { emoji: '😟', value: '2.5', label: 'Slight Improvement' },
                              { emoji: '😐', value: '5', label: 'Moderate Improvement' },
                              { emoji: '😊', value: '7.5', label: 'Great Improvement' },
                              { emoji: '😁', value: '10', label: 'Complete Improvement' },
                            ].map(({ emoji, value, label }) => {
                                const isSelected = rating === value;
                                return (
                                    <div key={value} className="flex flex-col items-center space-y-1 w-1/5"> {/* Give each item a width */} 
                                        <Button
                                            type="button" // Prevent form submission
                                            variant={isSelected ? "secondary" : "ghost"}
                                            size="icon"
                                            onClick={() => setRating(value)}
                                            className={`text-xl rounded-full p-0 transition-all duration-150 ease-in-out ${isSelected ? 'h-11 w-11 text-2xl' : 'h-9 w-9'}`} // Conditional size and bigger text
                                            aria-label={`Rate effectiveness as ${value}: ${label}`}
                                        >
                                            {emoji}
                                        </Button>
                                        <span className={`text-xs text-center ${isSelected ? 'font-semibold text-primary' : 'text-muted-foreground'}`}> {/* Added text-center */}
                                            {label}
                                        </span>
                                    </div>
                                );
                            })}
                         </div>
                         {/* End Face Rating Component */}
                    </div>

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
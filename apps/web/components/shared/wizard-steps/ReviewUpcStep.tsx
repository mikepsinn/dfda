'use client'

import React, { useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label'
import { ImageType } from '../ImageAnalysisCapture';
import { ReviewStepLayout } from './ReviewStepLayout';
import { useImageAnalysisWizardContext } from '../ImageAnalysisWizardContext';

export function ReviewUpcStep() {
  const { state, actions } = useImageAnalysisWizardContext();
  const { formData, isLoading } = state;

  // Handler for confirming this step and proceeding (always goes to final review from UPC)
  const handleConfirmAndNext = useCallback(() => {
    actions.goToStep('finalReview');
  }, [actions]);

  // Handler for going straight to final review (same as confirming)
  const handleConfirmAndGoToFinal = useCallback(() => {
    actions.goToStep('finalReview');
  }, [actions]);

  // Handler for skipping this optional step (same as confirming)
  const handleSkipStepAndContinue = useCallback(() => {
    actions.goToStep('finalReview');
  }, [actions]);

  // Handler for retaking image - Use a dedicated action
  const handleRetake = useCallback((type: ImageType) => {
    actions.retakeImage(type); // This action should handle state reset and navigation
  }, [actions]);

  // Form change handler
  const handleFormChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    actions.updateFormField('upc', e.target.value);
  }, [actions]);

  // Determine disabled states (can add more specific logic if needed)
  const isConfirmDisabled = false; // Example: Add validation if needed
  const isSkipDisabled = false;

  return (
    <ReviewStepLayout
        stepTitle="Review UPC"
        stepDescription="Confirm barcode."
        // Remove incorrect props, layout uses context
        imageType="upc"
        // Correct prop names and pass handlers
        handleConfirmAndNext={handleConfirmAndNext}
        handleConfirmAndGoToFinal={handleConfirmAndGoToFinal}
        handleSkipStepAndContinue={handleSkipStepAndContinue}
        handleRetake={handleRetake}
        // Pass disabled states
        confirmAndNextDisabled={isConfirmDisabled}
        skipStepAndContinueDisabled={isSkipDisabled}
        // confirmGoToFinalDisabled is handled internally by layout for non-primary
        // Customize button text for the last review step
        confirmNextButtonText="Confirm UPC & Finish Review"
        confirmGoToFinalButtonText="Go to Final Review (Skip UPC)" // Keep this text for clarity
    >
      {/* Editable Fields Relevant to UPC Analysis */}
      <div className="w-full max-w-md space-y-3">
           <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="upc-review" className="text-right">UPC</Label>
                <Input
                    id="upc-review"
                    name="upc"
                    value={formData.upc || ''}
                    onChange={handleFormChange}
                    className="col-span-3"
                    disabled={isLoading}
                    placeholder="Confirm or enter UPC"
                />
            </div>
      </div>
    </ReviewStepLayout>
  );
}

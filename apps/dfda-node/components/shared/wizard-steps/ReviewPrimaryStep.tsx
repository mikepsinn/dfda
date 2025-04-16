'use client'

import React, { useCallback } from 'react';
import { useImageAnalysisWizardContext } from '../ImageAnalysisWizardContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AnalyzedImageResult } from '@/lib/actions/analyze-image';
import { ImageType, ImageAnalysisStep } from '../ImageAnalysisCapture'; 
import { ReviewStepLayout } from './ReviewStepLayout'; // Import the layout
import { logger } from '@/lib/logger'; // Import logger for potential issues

export function ReviewPrimaryStep() {
  const { state, actions } = useImageAnalysisWizardContext();
  const { formData, isLoading } = state; // Removed imageStates as it's not directly used here

  // Handler for confirming this step and proceeding
  const handleConfirmAndNext = useCallback(() => {
    if (!formData.type || !formData.name) {
      logger.warn('Cannot proceed from primary review without type and name');
      // TODO: Show inline validation error
      return;
    }
    // Call a dedicated action in the hook to handle the transition logic
    actions.goToNextStepFromReview('primary'); 
  }, [actions, formData.type, formData.name]); // Depend on specific fields needed for validation

  // Handler for going straight to final review
  const handleConfirmAndGoToFinal = useCallback(() => {
    if (!formData.type || !formData.name) {
      logger.warn('Cannot proceed from primary review without type and name');
      // TODO: Show inline validation error
      return;
    }
    actions.goToStep('finalReview');
  }, [actions, formData]);

  // Handler for form input changes
  const handleFormChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    actions.updateFormField(name as keyof AnalyzedImageResult, value);
  }, [actions]);

  // Handler for select change
  const handleSelectChange = useCallback((value: string) => {
    if (['food', 'treatment', 'supplement', 'other'].includes(value)) {
      actions.updateFormField('type', value as AnalyzedImageResult['type']);
    }
  }, [actions]);

  // Handler for retaking image - Use a dedicated action
  const handleRetake = useCallback((type: ImageType) => {
    actions.retakeImage(type); // This action should handle state reset and navigation
  }, [actions]);

  // Determine disabled state based on required fields for this step
  const isConfirmDisabled = !formData.type || !formData.name;

  return (
    <ReviewStepLayout
        stepTitle="Review Primary"
        stepDescription="Confirm extracted details."
        imageType='primary'
        handleConfirmAndNext={handleConfirmAndNext}
        handleConfirmAndGoToFinal={handleConfirmAndGoToFinal}
        handleRetake={handleRetake}
        confirmAndNextDisabled={isConfirmDisabled}
        confirmGoToFinalDisabled={isConfirmDisabled}
    >
      {/* Pass specific form fields as children */}
      <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type-primary" className="text-right">Type*</Label>
            <Select 
                name="type" 
                value={formData.type || ''} 
                onValueChange={handleSelectChange} 
                disabled={isLoading}
            >
                <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="food">Food</SelectItem>
                    <SelectItem value="treatment">Treatment</SelectItem>
                    <SelectItem value="supplement">Supplement</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                </SelectContent>
            </Select>
        </div>
         <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name-primary" className="text-right">Name*</Label>
            <Input 
                id="name-primary" 
                name="name" 
                value={formData.name || ''} 
                onChange={handleFormChange} 
                className="col-span-3" 
                disabled={isLoading} 
                placeholder="Confirm or enter item name"
                required 
            />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="brand-primary" className="text-right">Brand</Label>
            <Input 
                id="brand-primary" 
                name="brand" 
                value={formData.brand || ''} 
                onChange={handleFormChange} 
                className="col-span-3" 
                disabled={isLoading} 
                placeholder="Confirm or enter brand name" 
            />
        </div>
         {/* Maybe add details field here too? */}
    </ReviewStepLayout>
  );
}

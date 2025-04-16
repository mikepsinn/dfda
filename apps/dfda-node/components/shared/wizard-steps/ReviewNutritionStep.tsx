'use client'

import React, { useCallback, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AnalyzedImageResult } from '@/lib/actions/analyze-image';
import { ImageType, ImageAnalysisStep } from '../ImageAnalysisCapture';
import { ReviewStepLayout } from './ReviewStepLayout';
import { logger } from '@/lib/logger';
import { useImageAnalysisWizardContext } from '../ImageAnalysisWizardContext';

export function ReviewNutritionStep() {
  const { state, actions } = useImageAnalysisWizardContext();
  const { formData, isLoading } = state;

  // Add defensive check: Only render content if type is food
  if (formData.type !== 'food') {
    // This case ideally shouldn't be reached if parent logic is correct
    logger.warn('ReviewNutritionStep rendered with non-food type', { type: formData.type });
    return <div className="p-4 text-red-600">Error: Nutrition review is only applicable for food items.</div>;
  }

  // Handler for confirming this step and proceeding
  const handleConfirmAndNext = useCallback(() => {
    // Call the hook's action to handle the transition logic
    actions.goToNextStepFromReview('nutrition');
  }, [actions]);

  // Handler for going straight to final review
  const handleConfirmAndGoToFinal = useCallback(() => {
    actions.goToStep('finalReview');
  }, [actions]);

  // Handler for skipping this optional step
  const handleSkipStepAndContinue = useCallback(() => {
    actions.goToNextStepFromReview('nutrition');
  }, [actions]);

  // Handler for retaking image
  const handleRetake = useCallback((type: ImageType) => {
    actions.retakeImage(type);
  }, []);

  // Form change handlers
  const handleNumericFormChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = value === '' ? null : parseFloat(value);
    if (value === '' || (numValue !== null && !isNaN(numValue))) {
        actions.updateFormField(name as keyof AnalyzedImageResult, numValue);
    }
  }, [actions]);

  const handleFormChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    actions.updateFormField(name as keyof AnalyzedImageResult, value);
  }, [actions]);

  // Determine disabled states
  const isConfirmDisabled = false; // Can add validation if needed
  const isSkipDisabled = false;

  return (
    <ReviewStepLayout
        stepTitle="Review Nutrition"
        stepDescription="Confirm nutrition facts."
        imageType="nutrition"
        handleConfirmAndNext={handleConfirmAndNext}
        handleConfirmAndGoToFinal={handleConfirmAndGoToFinal}
        handleSkipStepAndContinue={handleSkipStepAndContinue}
        handleRetake={handleRetake}
        confirmAndNextDisabled={isConfirmDisabled}
        skipStepAndContinueDisabled={isSkipDisabled}
        confirmNextButtonText="Confirm Nutrition & Continue"
        confirmGoToFinalButtonText="Skip Remaining Images & Finish"
    >
        {/* Editable Fields Relevant to Nutrition Analysis */}
        <div className="w-full max-w-md space-y-3">
             <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="servingSize_quantity" className="text-right">Serving Size</Label>
                  <Input id="servingSize_quantity" name="servingSize_quantity" type="number" value={formData.servingSize_quantity ?? ''} onChange={handleNumericFormChange} className="col-span-2" disabled={isLoading} placeholder="e.g., 30" />
                  <Input id="servingSize_unit" name="servingSize_unit" value={formData.servingSize_unit || ''} onChange={handleFormChange} className="col-span-1" disabled={isLoading} placeholder="e.g., g" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="calories_per_serving" className="text-right">Calories</Label>
                  <Input id="calories_per_serving" name="calories_per_serving" type="number" value={formData.calories_per_serving ?? ''} onChange={handleNumericFormChange} className="col-span-3" disabled={isLoading} placeholder="e.g., 110" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="fat_per_serving" className="text-right">Fat (g)</Label>
                  <Input id="fat_per_serving" name="fat_per_serving" type="number" value={formData.fat_per_serving ?? ''} onChange={handleNumericFormChange} className="col-span-3" disabled={isLoading} placeholder="e.g., 2.5" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="carbs_per_serving" className="text-right">Carbs (g)</Label>
                  <Input id="carbs_per_serving" name="carbs_per_serving" type="number" value={formData.carbs_per_serving ?? ''} onChange={handleNumericFormChange} className="col-span-3" disabled={isLoading} placeholder="e.g., 22" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="protein_per_serving" className="text-right">Protein (g)</Label>
                  <Input id="protein_per_serving" name="protein_per_serving" type="number" value={formData.protein_per_serving ?? ''} onChange={handleNumericFormChange} className="col-span-3" disabled={isLoading} placeholder="e.g., 4" />
              </div>
        </div>
    </ReviewStepLayout>
  );
}

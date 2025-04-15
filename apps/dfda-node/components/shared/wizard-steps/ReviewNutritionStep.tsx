'use client'

import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AnalyzedImageResult } from '@/lib/actions/analyze-image';
import { ImageType, ImageAnalysisStep } from '../ImageAnalysisCapture';
import { ReviewStepLayout } from './ReviewStepLayout';

interface ReviewNutritionStepProps {
  formData: Partial<AnalyzedImageResult>;
  nutritionImagePreview?: string | null;
  isSaving: boolean;
  isAnalyzing: boolean;
  // Handlers
  handleNumericFormChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleFormChange: (e: React.ChangeEvent<HTMLInputElement>) => void; // For unit
  determineNextStep: (currentData: Partial<AnalyzedImageResult>) => ImageType | 'finalReview';
  goToStep: (step: ImageAnalysisStep, nextImageType?: ImageType) => void;
  retakeImage: (type: ImageType) => void;
  // Add the layout handlers
  onConfirmAndGoToFinal: () => void;
  onSkipStepAndContinue: () => void;
}

export function ReviewNutritionStep({
  formData,
  nutritionImagePreview,
  isSaving,
  isAnalyzing,
  handleNumericFormChange,
  handleFormChange,
  determineNextStep,
  goToStep,
  retakeImage,
  onConfirmAndGoToFinal,
  onSkipStepAndContinue,
}: ReviewNutritionStepProps) {

  const handleConfirmAndNext = () => {
    const next = determineNextStep(formData);
    if (next === 'finalReview') {
        goToStep('finalReview');
    } else {
        // Determine the capture step based on the image type
        const nextCaptureStep = `capture${next.charAt(0).toUpperCase() + next.slice(1)}` as ImageAnalysisStep;
        goToStep(nextCaptureStep, next);
    }
  };

  return (
    <ReviewStepLayout
        stepTitle="Step 4: Review Nutrition Details"
        stepDescription="Confirm the nutrition facts extracted from the image."
        imagePreviewUrl={nutritionImagePreview}
        imageType="nutrition"
        isSaving={isSaving}
        isAnalyzing={isAnalyzing}
        onConfirmAndNext={handleConfirmAndNext}
        onConfirmAndGoToFinal={onConfirmAndGoToFinal}
        onSkipStepAndContinue={onSkipStepAndContinue}
        onRetake={retakeImage}
    >
        {/* Editable Fields Relevant to Nutrition Analysis */}
        <div className="w-full max-w-md space-y-3">
             <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="servingSize_quantity" className="text-right">Serving Size</Label>
                  <Input id="servingSize_quantity" name="servingSize_quantity" type="number" value={formData.servingSize_quantity ?? ''} onChange={handleNumericFormChange} className="col-span-2" disabled={isSaving || isAnalyzing} placeholder="e.g., 30" />
                  <Input id="servingSize_unit" name="servingSize_unit" value={formData.servingSize_unit || ''} onChange={handleFormChange} className="col-span-1" disabled={isSaving || isAnalyzing} placeholder="e.g., g" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="calories_per_serving" className="text-right">Calories</Label>
                  <Input id="calories_per_serving" name="calories_per_serving" type="number" value={formData.calories_per_serving ?? ''} onChange={handleNumericFormChange} className="col-span-3" disabled={isSaving || isAnalyzing} placeholder="e.g., 110" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="fat_per_serving" className="text-right">Fat (g)</Label>
                  <Input id="fat_per_serving" name="fat_per_serving" type="number" value={formData.fat_per_serving ?? ''} onChange={handleNumericFormChange} className="col-span-3" disabled={isSaving || isAnalyzing} placeholder="e.g., 2.5" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="carbs_per_serving" className="text-right">Carbs (g)</Label>
                  <Input id="carbs_per_serving" name="carbs_per_serving" type="number" value={formData.carbs_per_serving ?? ''} onChange={handleNumericFormChange} className="col-span-3" disabled={isSaving || isAnalyzing} placeholder="e.g., 22" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="protein_per_serving" className="text-right">Protein (g)</Label>
                  <Input id="protein_per_serving" name="protein_per_serving" type="number" value={formData.protein_per_serving ?? ''} onChange={handleNumericFormChange} className="col-span-3" disabled={isSaving || isAnalyzing} placeholder="e.g., 4" />
              </div>
        </div>
    </ReviewStepLayout>
  );
} 
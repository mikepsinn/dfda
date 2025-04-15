'use client'

import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AnalyzedImageResult } from '@/lib/actions/analyze-image';
import { ImageType, ImageAnalysisStep } from '../ImageAnalysisCapture';
import { ReviewStepLayout } from './ReviewStepLayout';

interface ReviewUpcStepProps {
  formData: Partial<AnalyzedImageResult>;
  upcImagePreview?: string | null;
  isSaving: boolean;
  isAnalyzing: boolean;
  // Handlers
  handleFormChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  goToStep: (step: ImageAnalysisStep, nextImageType?: ImageType) => void;
  retakeImage: (type: ImageType) => void;
  // Add the layout handlers
  onConfirmAndGoToFinal: () => void;
  onSkipStepAndContinue: () => void; // Even though it maps to GoToFinal
}

export function ReviewUpcStep({
  formData,
  upcImagePreview,
  isSaving,
  isAnalyzing,
  handleFormChange,
  goToStep,
  retakeImage,
  onConfirmAndGoToFinal, // Destructure
  onSkipStepAndContinue, // Destructure (but we'll use onConfirmAndGoToFinal for its action)
}: ReviewUpcStepProps) {

  const handleConfirmAndFinish = () => {
    goToStep('finalReview');
  };

  // Define handler for the primary button
  const handlePrimaryConfirm = handleConfirmAndFinish;
  // Map both the "Go to Final" and "Skip Step" handlers to the same finish action
  const handleGoToFinal = handleConfirmAndFinish;
  const handleSkipThisStep = handleConfirmAndFinish; 

  return (
    <ReviewStepLayout
        stepTitle="Step 8: Review UPC"
        stepDescription="Confirm the UPC extracted from the image."
        imagePreviewUrl={upcImagePreview}
        imageType="upc"
        isSaving={isSaving}
        isAnalyzing={isAnalyzing}
        // Hook up handlers
        onConfirmAndNext={handlePrimaryConfirm}
        onConfirmAndGoToFinal={handleGoToFinal} // Pass down renamed handler
        onSkipStepAndContinue={handleSkipThisStep} // Pass down handler for skip button
        onRetake={retakeImage}
        // Adjust button text for clarity
        confirmNextButtonText="Confirm UPC & Finish Review"
        confirmGoToFinalButtonText="Go to Final Review (Skip UPC)"
        // skipStepAndContinueDisabled={...} // Optional disable
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
                    disabled={isSaving || isAnalyzing}
                    placeholder="Confirm or enter UPC"
                />
            </div>
      </div>
    </ReviewStepLayout>
  );
} 
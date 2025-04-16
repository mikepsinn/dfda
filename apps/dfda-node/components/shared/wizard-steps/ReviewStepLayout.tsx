'use client'

import React, { ReactNode } from 'react';
import { useImageAnalysisWizardContext } from '../ImageAnalysisWizardContext';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ImageType, ImageAnalysisStep } from '../ImageAnalysisCapture'; // Import shared types

// Assuming ImageAnalysisStep is exported from parent or shared types - Now it is!

interface ReviewStepLayoutProps {
  stepTitle: string;
  stepDescription: string;
  imageType: ImageType; // Needed for alt text and retake action
  children: React.ReactNode; // Slot for specific form fields
  // Handlers
  handleConfirmAndNext: () => void;
  handleConfirmAndGoToFinal?: () => void;
  handleSkipStepAndContinue?: () => void;
  handleRetake: (type: ImageType) => void;
  confirmNextButtonText?: string;
  confirmGoToFinalButtonText?: string;
  confirmAndNextDisabled?: boolean;
  confirmGoToFinalDisabled?: boolean;
  skipStepAndContinueDisabled?: boolean;
}

export function ReviewStepLayout({
  stepTitle,
  stepDescription,
  imageType,
  children,
  handleConfirmAndNext,
  handleConfirmAndGoToFinal,
  handleSkipStepAndContinue,
  handleRetake,
  confirmNextButtonText = "Confirm & Add Next Image", // Default text
  confirmGoToFinalButtonText = "Confirm & Go to Final Review", // Default text
  confirmAndNextDisabled = false, // Default disabled state
  confirmGoToFinalDisabled = false, // Default disabled state
  skipStepAndContinueDisabled = false, // Default disabled state
}: ReviewStepLayoutProps) {

  const { state } = useImageAnalysisWizardContext();
  const { isLoading, imageStates, formData } = state;
  const imagePreviewUrl = imageStates[imageType]?.previewUrl;

  // Determine disabled states based on context
  const isGloballyDisabled = isLoading;
  const isConfirmAndNextDisabled = isGloballyDisabled || confirmAndNextDisabled;
  const isRequiredDataMissing = !formData.type || !formData.name;
  const isConfirmGoToFinalDisabled = isGloballyDisabled || (imageType === 'primary' && isRequiredDataMissing);
  const isSkipDisabled = isGloballyDisabled;

  // Determine if the current image type is optional (not primary)
  const isOptionalStep = imageType !== 'primary';

  return (
    <div className="flex flex-col items-center p-4 space-y-4">
      <h3 className="text-lg font-semibold">{stepTitle}</h3>
      <p className="text-sm text-muted-foreground text-center">
        {stepDescription}
      </p>

      {imagePreviewUrl && (
        <div className="relative w-32 h-32 mt-2 mb-4">
          <Image 
            src={imagePreviewUrl} 
            alt={`${imageType} preview`} 
            fill
            className="rounded-md border object-contain bg-background" 
            sizes="150px"
          />
        </div>
      )}

      {/* Form Fields Slot */} 
      <div className="w-full max-w-md space-y-3">
        {children}
      </div>

      {/* Action Buttons */} 
       <div className="w-full max-w-md space-y-2 border-t pt-4 mt-4">
         <Button 
            className="w-full"
            onClick={handleConfirmAndNext}
            disabled={isConfirmAndNextDisabled}
         >
            {confirmNextButtonText}
        </Button>
         {/* NEW: Skip Step & Continue Button (Only if optional step?) */} 
         {isOptionalStep && handleSkipStepAndContinue && (
           <Button 
               variant="secondary"
               className="w-full"
               onClick={handleSkipStepAndContinue}
               disabled={isSkipDisabled}
           >
               Skip {imageType.charAt(0).toUpperCase() + imageType.slice(1)} Image & Continue
           </Button>
         )}
         <Button 
            variant="secondary"
            className="w-full"
            onClick={handleConfirmAndGoToFinal}
            disabled={isConfirmGoToFinalDisabled}
         >
            {confirmGoToFinalButtonText}
        </Button>
         <Button 
            variant="outline"
            className="w-full"
            onClick={() => handleRetake(imageType)}
            disabled={isGloballyDisabled}
         >
            Retake {imageType.charAt(0).toUpperCase() + imageType.slice(1)} Image
        </Button>
      </div>
    </div>
  );
} 
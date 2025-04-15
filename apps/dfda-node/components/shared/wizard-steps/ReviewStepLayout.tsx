'use client'

import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ImageType, ImageAnalysisStep } from '../ImageAnalysisCapture'; // Import shared types

// Assuming ImageAnalysisStep is exported from parent or shared types - Now it is!

interface ReviewStepLayoutProps {
  stepTitle: string;
  stepDescription: string;
  imagePreviewUrl?: string | null;
  imageType: ImageType; // Needed for alt text and retake action
  isSaving: boolean;
  isAnalyzing: boolean;
  children: React.ReactNode; // Slot for specific form fields
  // Handlers
  onConfirmAndNext: () => void;
  onConfirmAndSkip: () => void;
  onRetake: (type: ImageType) => void;
  // onRetryAnalysis?: () => void; // Optional: Add later if needed
  // Optional props for button text and disabling
  confirmNextButtonText?: string;
  confirmSkipButtonText?: string;
  confirmAndNextDisabled?: boolean;
  confirmAndSkipDisabled?: boolean;
}

export function ReviewStepLayout({
  stepTitle,
  stepDescription,
  imagePreviewUrl,
  imageType,
  isSaving,
  isAnalyzing,
  children,
  onConfirmAndNext,
  onConfirmAndSkip,
  onRetake,
  confirmNextButtonText = "Confirm & Add Next Image", // Default text
  confirmSkipButtonText = "Confirm & Skip to Final Review", // Default text
  confirmAndNextDisabled = false, // Default disabled state
  confirmAndSkipDisabled = false, // Default disabled state
}: ReviewStepLayoutProps) {

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
            onClick={onConfirmAndNext}
            disabled={isSaving || isAnalyzing || confirmAndNextDisabled} // Use prop
        >
            {confirmNextButtonText} {/* Use prop */}
        </Button>
         <Button 
            variant="secondary"
            className="w-full"
            onClick={onConfirmAndSkip}
            disabled={isSaving || isAnalyzing || confirmAndSkipDisabled} // Use prop
        >
            {confirmSkipButtonText} {/* Use prop */}
        </Button>
         <Button 
            variant="outline"
            className="w-full"
            onClick={() => onRetake(imageType)} // Use the passed imageType
            disabled={isSaving || isAnalyzing}
        >
            Retake {imageType.charAt(0).toUpperCase() + imageType.slice(1)} Image
        </Button>
         {/* Placeholder for potential retry button */} 
         {/* <Button variant="outline" className="w-full" onClick={onRetryAnalysis} disabled={isSaving || isAnalyzing}>Retry Analysis</Button> */} 
      </div>
    </div>
  );
} 
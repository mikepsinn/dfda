'use client'

import React from 'react';
import { Button } from '@/components/ui/button';
import { ImageType, ImageAnalysisStep } from '../ImageAnalysisCapture'; // Import shared types

// Assuming ImageAnalysisStep is exported from parent or shared types

interface CaptureImageStepProps {
  stepTitle: string;
  stepDescription: string;
  imageType: ImageType;
  isSaving: boolean;
  isAnalyzing: boolean;
  isWebcamActive: boolean;
  captureMode: 'upload' | 'webcam' | 'undetermined';
  // Handlers
  renderImageCaptureControls: (type: ImageType) => React.ReactNode;
  goToStep: (step: ImageAnalysisStep, nextImageType?: ImageType) => void;
}

export function CaptureImageStep({
  stepTitle,
  stepDescription,
  imageType,
  isSaving,
  isAnalyzing,
  isWebcamActive,
  captureMode,
  renderImageCaptureControls,
  goToStep,
}: CaptureImageStepProps) {

  const handleSkip = () => {
    // Skipping any optional image goes to final review
    goToStep('finalReview'); 
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 space-y-4">
      <h3 className="text-lg font-semibold">{stepTitle}</h3>
       <p className="text-sm text-muted-foreground text-center">
        {stepDescription}
      </p>
      
      {captureMode === 'upload' && (
        <p className="text-sm text-muted-foreground text-center">Opening file upload for {imageType}...</p>
        /* File input is hidden, triggered by parent useEffect */
      )}

      {captureMode === 'webcam' && (
        <>
            <p className="text-sm text-muted-foreground text-center">Activate webcam for {imageType}.</p>
            {renderImageCaptureControls(imageType)}
        </>
      )}

      {captureMode === 'undetermined' && (
          <p className="text-sm text-red-600 text-center">Error: Capture mode not set. Please go back.</p>
      )}
      
       {/* Button to skip this optional step */}
        <Button 
            variant="secondary"
            className="w-full max-w-xs mt-4"
            onClick={handleSkip}
            disabled={isSaving || isAnalyzing || isWebcamActive}
        >
            Skip {imageType.charAt(0).toUpperCase() + imageType.slice(1)} Image
        </Button>
    </div>
  );
} 
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
}

export function ReviewUpcStep({
  formData,
  upcImagePreview,
  isSaving,
  isAnalyzing,
  handleFormChange,
  goToStep,
  retakeImage
}: ReviewUpcStepProps) {

  const handleConfirmAndFinish = () => {
    // After confirming UPC, always go to final review
    goToStep('finalReview');
  };

  // UPC step doesn't really have a 'skip' concept like others, 
  // as it's usually the last specific image. We pass the same handler
  // for 'next' and 'skip' in the layout, or could disable 'skip'.
  // Here, let's just make 'skip' do the same as 'next' (finish).
  const handleConfirmAndSkip = handleConfirmAndFinish; 

  return (
    <ReviewStepLayout
        stepTitle="Step 8: Review UPC"
        stepDescription="Confirm the UPC extracted from the image."
        imagePreviewUrl={upcImagePreview}
        imageType="upc"
        isSaving={isSaving}
        isAnalyzing={isAnalyzing}
        onConfirmAndNext={handleConfirmAndFinish} // Use the finish handler for the primary confirm button
        onConfirmAndSkip={handleConfirmAndSkip} // Use the finish handler for the skip button too
        onRetake={retakeImage}
        confirmNextButtonText="Confirm & Finish Review" // Custom button text
        confirmSkipButtonText="Finish Review (Skip UPC)" // Custom skip text (optional, maybe hide this)
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
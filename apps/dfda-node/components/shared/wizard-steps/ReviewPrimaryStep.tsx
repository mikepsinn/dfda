'use client'

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AnalyzedImageResult } from '@/lib/actions/analyze-image';
import { ImageType, ImageAnalysisStep } from '../ImageAnalysisCapture'; 
import { ReviewStepLayout } from './ReviewStepLayout'; // Import the layout

interface ReviewPrimaryStepProps {
  formData: Partial<AnalyzedImageResult>;
  primaryImagePreview?: string | null;
  isSaving: boolean;
  isAnalyzing: boolean;
  // Handlers passed from the parent
  handleFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSelectChange: (value: string) => void;
  determineNextStep: (currentData: Partial<AnalyzedImageResult>) => ImageType | 'finalReview';
  goToStep: (step: ImageAnalysisStep, nextImageType?: ImageType) => void;
  retakeImage: (type: ImageType) => void;
}

export function ReviewPrimaryStep({
  formData,
  primaryImagePreview,
  isSaving,
  isAnalyzing,
  handleFormChange,
  handleSelectChange,
  determineNextStep,
  goToStep,
  retakeImage
}: ReviewPrimaryStepProps) {

  const handleConfirmAndNext = () => {
    const next = determineNextStep(formData);
    if (next === 'finalReview') {
        goToStep('finalReview');
    } else {
        const nextCaptureStep = `capture${next.charAt(0).toUpperCase() + next.slice(1)}` as ImageAnalysisStep;
        goToStep(nextCaptureStep, next);
    }
  };

  const handleConfirmAndSkip = () => {
      goToStep('finalReview');
  };

  // Disable next/skip buttons if required fields are missing
  const isConfirmDisabled = isSaving || isAnalyzing || !formData.type || !formData.name;

  return (
    <ReviewStepLayout
        stepTitle="Step 2: Review Primary Details"
        stepDescription="Confirm the details extracted from the primary image."
        imagePreviewUrl={primaryImagePreview}
        imageType='primary'
        isSaving={isSaving}
        isAnalyzing={isAnalyzing}
        onConfirmAndNext={handleConfirmAndNext}
        onConfirmAndSkip={handleConfirmAndSkip}
        onRetake={retakeImage}
        // Disable buttons in layout based on local logic
        confirmAndNextDisabled={isConfirmDisabled}
        confirmAndSkipDisabled={isConfirmDisabled}
    >
      {/* Pass specific form fields as children */}
      <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type-primary" className="text-right">Type*</Label>
            <Select 
                name="type" 
                value={formData.type || ''} 
                onValueChange={handleSelectChange} 
                disabled={isSaving || isAnalyzing}
            >
                <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="food">Food</SelectItem>
                    <SelectItem value="treatment">Treatment</SelectItem>
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
                disabled={isSaving || isAnalyzing} 
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
                disabled={isSaving || isAnalyzing} 
                placeholder="Confirm or enter brand name" 
            />
        </div>
         {/* Maybe add details field here too? */}
    </ReviewStepLayout>
  );
}
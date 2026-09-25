'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Loader2, X, Camera } from 'lucide-react'
import { ImageAnalysisWizardProvider, useImageAnalysisWizardContext } from './ImageAnalysisWizardContext'
import { ScrollArea } from "@/components/ui/scroll-area"
import { ReviewPrimaryStep } from './wizard-steps/ReviewPrimaryStep'
import { ReviewNutritionStep } from './wizard-steps/ReviewNutritionStep'
import { ReviewIngredientsStep } from './wizard-steps/ReviewIngredientsStep'
import { ReviewUpcStep } from './wizard-steps/ReviewUpcStep'
import { CaptureImageStep } from './wizard-steps/CaptureImageStep'
import { AnalyzedImageResult } from '@/lib/actions/analyze-image'
import { FinalReviewStep } from './wizard-steps/FinalReviewStep'
import { AnalyzingStep } from './wizard-steps/AnalyzingStep'
import { SavingStep } from './wizard-steps/SavingStep'
import { logger } from '@/lib/logger'

// Define image types based on the plan
export type ImageType = 'primary' | 'nutrition' | 'ingredients' | 'upc';

// Define specific steps for the image analysis wizard
export type ImageAnalysisStep = 
  | 'capturePrimary' | 'analyzingPrimary' | 'reviewPrimary'
  | 'captureNutrition' | 'analyzingNutrition' | 'reviewNutrition'
  | 'captureIngredients' | 'analyzingIngredients' | 'reviewIngredients'
  | 'captureUpc' | 'analyzingUpc' | 'reviewUpc'
  | 'finalReview' | 'saving' | 'error';

// --- Props for the main component ---
interface ImageAnalysisCaptureProps {
  userId: string
  onSaveSuccess?: (data: AnalyzedImageResult) => void
}

// --- Visually Hidden Component ---
const VisuallyHidden = ({ children }: { children: React.ReactNode }) => (
  <span style={{
    border: 0,
    clip: 'rect(0 0 0 0)',
    height: '1px',
    margin: '-1px',
    overflow: 'hidden',
    padding: 0,
    position: 'absolute',
    width: '1px',
    whiteSpace: 'nowrap',
    wordWrap: 'normal',
  }}>
    {children}
  </span>
);

// --- Internal Component using Context ---
function ImageAnalysisCaptureInternal({ onClose }: { onClose: () => void }) {
  const { state, actions, refs } = useImageAnalysisWizardContext();
  const { currentStep, isLoading, formData, imageStates } = state;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasModeBeenSet = useRef(false);

  // Auto-close dialog on successful save
  useEffect(() => {
    // When save was successful, close the dialog after a short delay
    if (state.saveSuccessful) {
      logger.info('Save successful, auto-closing dialog');
      const timer = setTimeout(() => {
        onClose();
      }, 1000); // 1-second delay to show success state
      
      return () => clearTimeout(timer);
    }
  }, [state.saveSuccessful, onClose]);

  // Set capture mode to 'upload' once on component mount if it's undetermined
  useEffect(() => {
    // Only set the capture mode once to avoid infinite loops
    if (!hasModeBeenSet.current && state.captureMode === 'undetermined') {
      // Mark that we've handled the mode setting
      hasModeBeenSet.current = true;
      
      // Keep the mode as 'undetermined' to allow both webcam and upload options
      // Previously we were forcing to 'upload' which was hiding the webcam button
      // actions.setCaptureMode('upload');
    }
    
    // Reset the flag when the component unmounts to handle future dialog opens
    return () => { hasModeBeenSet.current = false; };
  }, [state.captureMode]);

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const typeToUpdate = state.activeImageType;

    if (file && typeToUpdate) {
        const reader = new FileReader();
        reader.onloadend = () => {
        const previewUrl = reader.result as string;
        // Use the action from context
        actions.uploadImage(typeToUpdate, file, previewUrl);

        // Step transition logic should ideally live within the hook/reducer based on the UPLOAD_IMAGE action
        // For now, keep the direct calls but use context actions
        if (typeToUpdate === 'primary') {
          actions.setCaptureMode('upload');
          actions.goToStep('analyzingPrimary');
        } else {
            const analyzingStep = `analyzing${typeToUpdate.charAt(0).toUpperCase() + typeToUpdate.slice(1)}` as ImageAnalysisStep;
          if (['analyzingNutrition', 'analyzingIngredients', 'analyzingUpc'].includes(analyzingStep)) {
            actions.goToStep(analyzingStep);
             } else {
            console.error("Invalid analyzing step derived:", analyzingStep);
            actions.goToStep('finalReview'); // Fallback
          }
        }
      };
      reader.readAsDataURL(file);

      // Reset file input value
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } else {
      // Handle case where no file selected or type missing (optional)
      console.warn('File change event without file or active type');
    }
  };

  return (
    <>
        <DialogHeader>
          <VisuallyHidden>
            <DialogTitle>Add Variable via Image</DialogTitle>
          <DialogDescription>
              Follow the steps to add images, review details, and save.
          </DialogDescription>
          </VisuallyHidden>
          <div className="relative">
            <DialogClose className="absolute top-0 right-0 p-2">
              <X className="h-6 w-6" />
            </DialogClose>
          </div>
        </DialogHeader>
        
        {/* Hidden file input - Keep accessible */} 
          <Input
            id="image-upload-input"
            type="file"
            accept="image/*"
          capture="environment"
            ref={fileInputRef}
            onChange={handleFileChange}
          className="hidden"
        disabled={isLoading}
        />
      {/* Hidden Canvas */}
      <canvas ref={refs.canvasRef} style={{ display: 'none' }} />

      {/* Main Content Area */}
        <ScrollArea className="flex-grow h-0 p-1">
        {/* Render steps based on state.currentStep from context */}
          {currentStep === 'capturePrimary' && (
          <CaptureImageStep
            stepTitle="Step 1: Add Main Item Image"
            stepDescription="Upload or use webcam for the front of package or main view."
            imageType='primary'
          />
        )}
        {currentStep === 'analyzingPrimary' && <AnalyzingStep type="primary" />}
        {currentStep === 'reviewPrimary' && state.analysisResult && <ReviewPrimaryStep />}
          {currentStep === 'captureNutrition' && (
             <CaptureImageStep 
                stepTitle="Add Nutrition Image"
                stepDescription="Scan or upload nutrition facts."
                imageType='nutrition'
          />
        )}
        {currentStep === 'analyzingNutrition' && <AnalyzingStep type="nutrition" />}
        {currentStep === 'reviewNutrition' && state.analysisResult && <ReviewNutritionStep />}
          {currentStep === 'captureIngredients' && (
             <CaptureImageStep 
                 stepTitle="Add Ingredients Image"
                 stepDescription="Scan or upload ingredients/dosage."
                 imageType='ingredients'
          />
        )}
        {currentStep === 'analyzingIngredients' && <AnalyzingStep type="ingredients" />}
        {currentStep === 'reviewIngredients' && state.analysisResult && <ReviewIngredientsStep />}
          {currentStep === 'captureUpc' && (
             <CaptureImageStep 
                 stepTitle="Add UPC Image"
                 stepDescription="Scan or upload barcode."
                 imageType='upc'
          />
        )}
        {currentStep === 'analyzingUpc' && <AnalyzingStep type="upc" />}
        {currentStep === 'reviewUpc' && state.analysisResult && <ReviewUpcStep />}
        {currentStep === 'finalReview' && <FinalReviewStep />}
        {currentStep === 'saving' && <SavingStep />}
        </ScrollArea>

      {/* Footer */}
        <DialogFooter className="mt-auto shrink-0 flex justify-end px-4 py-2 border-none">
        {state.currentStep === 'finalReview' && (
             <Button 
                type="button" 
            onClick={() => actions.saveWizardData()}
            disabled={isLoading || !formData.type || !formData.name || Object.keys(imageStates).length === 0}
             >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save Variable'}
             </Button>
          )}
        </DialogFooter>
    </>
  )
}

// --- Exported Wrapper Component ---
export function ImageAnalysisCapture({ userId, onSaveSuccess }: ImageAnalysisCaptureProps) {
  const [isOpen, setIsOpen] = useState(false); // Dialog open state managed here

  // Function to close the dialog
  const handleClose = () => {
    setIsOpen(false);
  };

  // Define WizardResetter *inside* the component where context is available
  const WizardResetter = () => {
    // Now this hook call is valid within the Provider's scope
    const { actions, state } = useImageAnalysisWizardContext();
    
    // Track dialog open state
    const isOpenRef = useRef(isOpen);
    
    useEffect(() => {
      logger.info(`Dialog state changed: ${isOpen ? 'opened' : 'closed'}`);
      
      // Update reference when dialog opens/closes
      isOpenRef.current = isOpen;
      
      // Return cleanup function that only resets if dialog is closing
      return () => {
        // Only reset wizard state when the dialog is actually closing
        // This prevents resetting during internal component re-renders
        if (isOpenRef.current && !isOpen) {
          logger.info("Dialog closed - resetting wizard state", {
            currentStep: state.currentStep,
            hasImages: Object.keys(state.imageStates).length > 0
          });
          actions.resetWizard();
        } else {
          logger.info("Component unmounting but not resetting wizard", {
            isOpen: isOpenRef.current,
            wasOpen: isOpenRef.current
          });
        }
      };
    }, [actions, state.currentStep, state.imageStates]); // Removed isOpen from dependencies
    
    return null; // This component doesn't render anything visible
  };

  return (
    // Pass userId and onSaveSuccess to the Provider
    <ImageAnalysisWizardProvider userId={userId} onSaveSuccess={onSaveSuccess}>
      {/* Manage Dialog open state here */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Camera className="mr-2 h-4 w-4" /> Add Variable via Image
          </Button>
        </DialogTrigger>
        <DialogContent className="h-screen w-screen max-w-full sm:max-w-full flex flex-col dialog-content-wrapper">
          {/* Render WizardResetter only when dialog is open and within Provider scope */}
          {isOpen && <WizardResetter />} {/* Render resetter only when open */}
          {/* Render the internal component which uses the context */}
          <ImageAnalysisCaptureInternal onClose={handleClose} />
        </DialogContent>
      </Dialog>
    </ImageAnalysisWizardProvider>
  );
}

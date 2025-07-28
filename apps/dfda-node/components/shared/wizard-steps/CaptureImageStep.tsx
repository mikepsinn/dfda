'use client'

import React, { useRef } from 'react';
import { useImageAnalysisWizardContext } from '../ImageAnalysisWizardContext';
import { Button } from '@/components/ui/button';
import { ImageType } from '../ImageAnalysisCapture';
import { Camera, Upload, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { logger } from '@/lib/logger';

interface CaptureImageStepProps {
  stepTitle: string;
  stepDescription: string;
  imageType: ImageType;
}

interface ImageStateWithPreview {
  file?: File;
  previewUrl: string;
}

export function CaptureImageStep({
  stepTitle,
  stepDescription,
  imageType,
}: CaptureImageStepProps) {
  const { state, actions, refs, webcam } = useImageAnalysisWizardContext();
  const { isLoading, captureMode, imageStates } = state;
  const { isWebcamActive } = webcam;
  const { videoRef } = refs;
  
  // Reference to track captured file
  const capturedFileRef = useRef<File | null>(null);

  // Function to trigger file input
  const handleRequestUpload = () => {
    logger.info(`Setting active image type for upload: ${imageType}`);
    actions.setActiveImageType(imageType);
    // Trigger file input click
    document.getElementById('image-upload-input')?.click();
  };

  // Function to request webcam
  const handleRequestWebcam = () => {
    logger.info(`Requesting webcam for image type: ${imageType}`);
    actions.setActiveImageType(imageType);
    actions.requestWebcam(imageType);
  };
  
  // Function to manually trigger analysis without relying on state updates
  const manuallyTriggerAnalysis = async (file: File, isPrimaryOnly: boolean) => {
    logger.info('Manually triggering analysis with direct file reference');
    
    try {
      // When analyzing a primary image, pass the file directly to analyzeImages
      // This bypasses the need to wait for state updates
      if (isPrimaryOnly && imageType === 'primary') {
        logger.info(`Analyzing primary image directly, size: ${file.size} bytes`);
        actions.analyzeImages(true, file);
      } else {
        // For other image types, use the standard approach
        actions.analyzeImages(isPrimaryOnly);
      }
    } catch (error) {
      logger.error('Manual analysis failed:', { error });
    }
  };
  
  // Function to capture image
  const handleCaptureImage = async () => {
    if (isLoading) {
      logger.info("Capture attempt ignored - already loading");
      return;
    }

    try {
      logger.info(`Attempting to capture image for type: ${imageType}`);
      const captureResult = await actions.captureImage();
      
      if (captureResult) {
        const { file: capturedFile, previewUrl: imageDataUrl } = captureResult;
        logger.info(`Image capture successful, file size: ${capturedFile.size} bytes, type: ${capturedFile.type}`);
        
        // Store the file in a ref for direct access
        capturedFileRef.current = capturedFile;
        
        // 1. Upload the image to state
        logger.info(`Uploading captured image to state for type: ${imageType}`);
        actions.uploadImage(imageType, capturedFile, imageDataUrl);
        
        // 2. Set capture mode if needed
        if (imageType === 'primary') {
          logger.info("Setting capture mode to webcam");
          actions.setCaptureMode('webcam');
        }
        
        // 3. Instead of navigating, dispatch the START_ANALYSIS action directly
        logger.info(`Manually starting analysis for ${imageType} image`);
        
        // Manually trigger analysis with direct reference to the file
        const isPrimaryOnly = imageType === 'primary';
        // Give a small delay to ensure UI updates
        setTimeout(() => {
          manuallyTriggerAnalysis(capturedFile, isPrimaryOnly);
        }, 100);
      } else {
        logger.warn(`Capture result was null for type: ${imageType}`);
      }
    } catch (error) {
      logger.error("Failed to capture image:", { error });
      actions.stopWebcam();
    }
  };

  const handleSkip = () => {
    // Skipping any optional image goes to final review
    actions.goToStep('finalReview');
  };

  // Determine if skip button should be shown (only for optional steps)
  const showSkipButton = imageType !== 'primary';
  const showUpload = captureMode === 'upload' || captureMode === 'undetermined';
  const showWebcam = captureMode === 'webcam' || captureMode === 'undetermined';
  const disableButtons = isLoading || isWebcamActive;

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 space-y-4">
      <h3 className="text-lg font-semibold">{stepTitle}</h3>
      <p className="text-sm text-muted-foreground text-center">
        {stepDescription}
      </p>
      
      <div className="w-full max-w-xs space-y-2">
        {/* Show image preview if we have it */}
        {imageStates[imageType]?.previewUrl && (
          <div className="relative w-full h-32 mt-1">
            <Image
              src={(imageStates[imageType] as ImageStateWithPreview).previewUrl}
              alt={`${imageType} preview`}
              fill
              className="rounded-md border object-contain bg-background"
              sizes="(max-width: 768px) 50vw, 250px"
            />
            <Button 
              variant="destructive" 
              size="icon" 
              onClick={() => actions.removeImage(imageType)} 
              disabled={disableButtons} 
              className="absolute top-1 right-1 z-10 h-6 w-6 p-1" 
              aria-label={`Remove ${imageType} image`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Show webcam video when active */}
        {!imageStates[imageType] && isWebcamActive && imageType === state.activeImageType && (
          <div className="relative mt-1 border rounded-md overflow-hidden bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-auto max-h-40"
              style={{ transform: 'scaleX(-1)' }}
            />
            <Button 
              onClick={handleCaptureImage} 
              size="sm" 
              className="absolute bottom-1 left-1/2 transform -translate-x-1/2 z-10" 
              aria-label="Capture image"
            >
              Capture
            </Button>
            <Button 
              onClick={actions.stopWebcam} 
              variant="destructive" 
              size="sm" 
              className="absolute top-1 right-1 z-10 p-1 h-auto" 
              aria-label="Stop webcam"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Upload/Webcam Buttons */}
        {!imageStates[imageType] && (!isWebcamActive || imageType !== state.activeImageType) && (
          <div className="flex gap-2 mt-1">
            {showUpload && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRequestUpload} 
                disabled={disableButtons} 
                className="flex-1"
              >
                <Upload className="mr-1.5 h-3.5 w-3.5" /> Upload
              </Button>
            )}
            {showWebcam && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRequestWebcam} 
                disabled={disableButtons} 
                className="flex-1"
              >
                <Camera className="mr-1.5 h-3.5 w-3.5" /> Webcam
              </Button>
            )}
          </div>
        )}
      </div>
      
      {/* Button to skip this optional step */}
      {showSkipButton && (
        <Button 
          variant="secondary"
          className="w-full max-w-xs mt-4"
          onClick={handleSkip}
          disabled={isLoading || isWebcamActive}
        >
          Skip {imageType.charAt(0).toUpperCase() + imageType.slice(1)} Image
        </Button>
      )}
    </div>
  );
}

export default CaptureImageStep; 
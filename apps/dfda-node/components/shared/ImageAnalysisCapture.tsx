'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Upload, AlertCircle, Camera, ImageIcon, Trash2 } from 'lucide-react'
import { analyzeImageAction, AnalyzedImageResult } from '@/lib/actions/analyze-image'
import { saveVariableMeasurementsFromImageAction } from '@/lib/actions/save-variable-measurements-from-image'
import { logger } from '@/lib/logger'
import { toast } from '@/components/ui/use-toast'
import Image from 'next/image'
import { ScrollArea } from "@/components/ui/scroll-area"
import { ReviewPrimaryStep } from './wizard-steps/ReviewPrimaryStep'
import { ReviewNutritionStep } from './wizard-steps/ReviewNutritionStep'
import { ReviewIngredientsStep } from './wizard-steps/ReviewIngredientsStep'
import { ReviewUpcStep } from './wizard-steps/ReviewUpcStep'
import { CaptureImageStep } from './wizard-steps/CaptureImageStep'

// Define image types based on the plan
const IMAGE_TYPES = ['primary', 'nutrition', 'ingredients', 'upc'] as const;
export type ImageType = typeof IMAGE_TYPES[number];

// Helper type for image state
type ImageState = { file: File | null; previewUrl: string | null };

// Define specific steps for the image analysis wizard
export type ImageAnalysisStep = 
  | 'capturePrimary'
  | 'analyzingPrimary'    // Analyze only primary
  | 'reviewPrimary'       // Show primary preview, base fields, offer next step
  | 'captureNutrition'    // Triggered from reviewPrimary if food
  | 'analyzingNutrition'  // Analyze primary + nutrition
  | 'reviewNutrition'     // Show nutrition preview, nutrition fields, offer next step
  | 'captureIngredients'  // Triggered from previous review
  | 'analyzingIngredients'// Analyze primary + ingredients + others
  | 'reviewIngredients'   // Show ingredients preview, ingredients list, offer next step
  | 'captureUpc'          // Triggered from previous review
  | 'analyzingUpc'        // Analyze primary + UPC + others
  | 'reviewUpc'           // Show UPC preview, UPC field, offer next step
  | 'finalReview'         // Show all previews and the full editable form
  | 'saving'
  | 'error';              // Generic error state for now

// Runtime constant for step validation
const ALL_IMAGE_ANALYSIS_STEPS: ImageAnalysisStep[] = [
    'capturePrimary', 'analyzingPrimary', 'reviewPrimary',
    'captureNutrition', 'analyzingNutrition', 'reviewNutrition',
    'captureIngredients', 'analyzingIngredients', 'reviewIngredients',
    'captureUpc', 'analyzingUpc', 'reviewUpc',
    'finalReview', 'saving', 'error'
];

interface ImageAnalysisCaptureProps {
  userId: string
  onSaveSuccess?: (data: AnalyzedImageResult) => void
}

// Helper function to convert Data URL to File object
function dataURLtoFile(dataurl: string, filename: string): File | null {
    try {
        const arr = dataurl.split(',');
        if (arr.length < 2) return null;
        const mimeMatch = arr[0].match(/:(.*?);/);
        if (!mimeMatch) return null;
        const mime = mimeMatch[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type: mime });
    } catch (error) {
        logger.error("Error converting data URL to File", { error });
        return null;
    }
}

// Define initial empty state for the complex form data
const initialFormData: Partial<AnalyzedImageResult> = {
    type: undefined,
    name: '',
    brand: '',
    upc: '',
    details: '',
    // Food specific
    servingSize_quantity: null,
    servingSize_unit: '',
    calories_per_serving: null,
    fat_per_serving: null,
    protein_per_serving: null,
    carbs_per_serving: null,
    ingredients: [],
    // Treatment specific
    dosage_form: '',
    dosage_instructions: '',
    active_ingredients: [],
    inactive_ingredients: [],
}

// --- Visually Hidden Component (for Accessibility) ---
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

export function ImageAnalysisCapture({ userId, onSaveSuccess }: ImageAnalysisCaptureProps) {
  const [isOpen, setIsOpen] = useState(false)
  // State for multiple images
  const [imageStates, setImageStates] = useState<Partial<Record<ImageType, ImageState>>>({})
  // State for which image type is currently being captured/uploaded
  const [activeImageType, setActiveImageType] = useState<ImageType>('primary') 
  // State for tracking wizard step
  const [currentStep, setCurrentStep] = useState<ImageAnalysisStep>('capturePrimary');
  // State to track the initial capture mode
  const [captureMode, setCaptureMode] = useState<'upload' | 'webcam' | 'undetermined'>('undetermined');
  const [analysisResult, setAnalysisResult] = useState<AnalyzedImageResult | null>(null)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Webcam state
  const [isWebcamActive, setIsWebcamActive] = useState(false)
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Form state now uses the full AnalyzedImageResult structure
  const [formData, setFormData] = useState<Partial<AnalyzedImageResult>>(initialFormData)

  // Effect to link webcam stream to video element
  useEffect(() => {
    if (videoRef.current && webcamStream) {
      videoRef.current.srcObject = webcamStream;
    }
    // Cleanup function to remove srcObject when stream is stopped or component unmounts
    return () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [webcamStream]); // Dependency array includes webcamStream

  // Effect to automatically trigger analysis when entering an analyzing step
  useEffect(() => {
    const analyzingSteps: ImageAnalysisStep[] = [
      'analyzingPrimary', 
      'analyzingNutrition', 
      'analyzingIngredients', 
      'analyzingUpc'
    ];

    if (analyzingSteps.includes(currentStep)) {
      // Determine if primary-only or full analysis is needed
      const isPrimaryOnly = currentStep === 'analyzingPrimary';
      
      // Check if necessary images are present
      let canAnalyze = false;
      if (isPrimaryOnly && imageStates.primary?.file) {
          canAnalyze = true;
      } else if (!isPrimaryOnly) {
          // For optional analysis, assume primary is needed + the relevant optional one
          // More complex logic might be needed if analyzing combos is desired
          const optionalType = activeImageType; // Type that triggered this analysis step
          if (imageStates.primary?.file && imageStates[optionalType]?.file) {
              canAnalyze = true;
          }
      }

      if (canAnalyze) {
        logger.info(`Auto-triggering analysis for step: ${currentStep}`, { isPrimaryOnly });
        handleAnalyzeImages(isPrimaryOnly);
      } else {
          logger.warn(`Skipping analysis trigger for ${currentStep}: required images not found.`);
          // Optional: Automatically go back if images are missing?
          // setCurrentStep('capturePrimary'); // Or previous review step?
      }
    }
    // Dependencies ensure this runs when step changes or relevant images are added/removed
  }, [currentStep, imageStates]); 
  // NOTE: Excluding handleAnalyzeImages intentionally to prevent loops if it changes identity

  // Reset state needs to clear multiple images and full form data
  const resetState = useCallback(() => {
    setImageStates({});
    setActiveImageType('primary');
    setCurrentStep('capturePrimary'); // Reset step to initial
    setCaptureMode('undetermined'); // Reset capture mode
    setAnalysisResult(null);
    setAnalysisError(null);
    setSaveError(null);
    setIsAnalyzing(false);
    setIsSaving(false);
    setFormData(initialFormData);
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    if (webcamStream) {
      webcamStream.getTracks().forEach(track => track.stop());
      setWebcamStream(null);
    }
    setIsWebcamActive(false);
  }, [webcamStream]); // Include webcamStream in dependencies

  // Function to trigger file input for the active image type
  const triggerFileInput = (type: ImageType) => {
    setActiveImageType(type);
    fileInputRef.current?.click();
  };

  // Handle file selection, associate with the active image type
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const typeToUpdate = activeImageType; // Capture active type before async ops
    if (file && typeToUpdate) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setImageStates(prev => ({
                ...prev,
                [typeToUpdate]: { file: file, previewUrl: reader.result as string }
            }));
            // If primary image was just added, move to analysis step
            if (typeToUpdate === 'primary') {
                setCaptureMode('upload'); // Set mode
                setCurrentStep('analyzingPrimary');
            } else {
                // If an optional image was added, go to its *analyzing* step
                const analyzingStep = `analyzing${typeToUpdate.charAt(0).toUpperCase() + typeToUpdate.slice(1)}` as ImageAnalysisStep;
                goToStep(analyzingStep);
            }
            // TODO: Trigger analysis for the new image? - Handled by new step transition
        }
        reader.readAsDataURL(file);
         // Reset file input value so onChange fires again for the same file
         if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    } else {
        // Clear the specific image type if no file is selected
        // setImageStates(prev => ({ ...prev, [activeImageType]: { file: null, previewUrl: null } }));
    }
  };

  // --- Analyze Image Action ---
  const handleAnalyzeImages = async (primaryOnly: boolean = false) => {
    let filesToAnalyze: { type: ImageType, file: File }[];

    if (primaryOnly) {
        if (!imageStates.primary?.file) {
            setAnalysisError("Primary image is required for initial analysis.");
            setCurrentStep('capturePrimary'); // Go back if primary is missing
            return;
        }
        filesToAnalyze = [{ type: 'primary', file: imageStates.primary.file }];
    } else {
        // Analyze all available images (for manual re-analysis or future use)
        filesToAnalyze = Object.entries(imageStates)
            .filter(([/* type */, state]) => state?.file)
            .map(([type, state]) => ({ type: type as ImageType, file: state!.file! }));
        
        if (filesToAnalyze.length === 0) {
            setAnalysisError("No images available to analyze.");
            // Decide where to go - maybe stay in current step or review?
            return; 
        }
        if (!imageStates.primary?.file) {
            setAnalysisError("Primary image is required to start analysis.");
            // If triggered manually without primary, what should happen? Error message is enough.
            return;
        }
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    // Keep previous results during re-analysis? Or clear? Let's clear.
    // setAnalysisResult(null); 

    const analysisFormData = new FormData();
    filesToAnalyze.forEach(({ type, file }) => {
      analysisFormData.append(`image_${type}`, file);
    });

    try {
      const result = await analyzeImageAction(analysisFormData);
      if (result.success) {
        setAnalysisResult(result.data);
        // Overwrite form data with analysis results.
        setFormData({ 
            ...initialFormData, // Start clean
            ...result.data,
            // Preserve any images already uploaded, in case analysis doesn't return all types
            // ingredients: result.data.ingredients ?? formData.ingredients, // Merge logic might be needed?
            // active_ingredients: result.data.active_ingredients ?? formData.active_ingredients,
            // inactive_ingredients: result.data.inactive_ingredients ?? formData.inactive_ingredients,
        });
        toast({ title: "Analysis Complete", description: `Identified as ${result.data.type}: ${result.data.name}` });
        
        // Decide next step based on which analysis just ran
        if (primaryOnly) {
            setCurrentStep('reviewPrimary');
      } else {
            // Assume analysis was triggered for the activeImageType after it was added
            const reviewStep = `review${activeImageType.charAt(0).toUpperCase() + activeImageType.slice(1)}` as ImageAnalysisStep;
            // Use runtime constant for validation
            if (ALL_IMAGE_ANALYSIS_STEPS.includes(reviewStep)) { 
                 setCurrentStep(reviewStep);
            } else {
                 logger.error("Invalid review step determined after analysis", { reviewStep, activeImageType });
                 setCurrentStep('finalReview'); // Fallback to final review
            }
        }
      } else {
        setAnalysisError(result.error);
        toast({ title: "Analysis Failed", description: result.error, variant: "destructive" });
        // Stay in the current capture step or go back to previous review?
        // For now, let's reset fully on failure
        setCurrentStep('capturePrimary'); // Reset to start
      }
    } catch (err) {
      logger.error("Client-side error calling analyzeImageAction", { error: err });
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      setAnalysisError(message);
      toast({ title: "Analysis Error", description: message, variant: "destructive" });
      // Stay in the current capture step or go back to previous review?
      // For now, let's reset fully on failure
      setCurrentStep('capturePrimary'); // Reset to start
    } finally {
      setIsAnalyzing(false);
    }
  };

  // --- Webcam Handling ---
  const requestWebcam = async (type: ImageType) => {
    setActiveImageType(type);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setWebcamStream(stream);
      setIsWebcamActive(true);
    } catch (err) {
      logger.error("Error accessing webcam", { error: err });
      // ... (error handling as before) ...
      toast({ title: "Webcam Error", description: "Could not access webcam.", variant: "destructive" });
      setIsWebcamActive(false);
    }
  };

  const stopWebcam = () => {
    if (webcamStream) {
      webcamStream.getTracks().forEach(track => track.stop());
      setWebcamStream(null);
    }
    setIsWebcamActive(false);
  }

  const captureImage = () => {
    if (videoRef.current && canvasRef.current && activeImageType) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const typeToUpdate = activeImageType; // Capture active type
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        if (context) {
            // Flip, draw, reset transform as before
            context.translate(canvas.width, 0);
            context.scale(-1, 1);
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            context.setTransform(1, 0, 0, 1, 0, 0);
            
            const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
            stopWebcam(); // Stop stream after capture

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `webcam-${typeToUpdate}-${timestamp}.jpg`;
            const capturedFile = dataURLtoFile(imageDataUrl, filename);
            
            if (capturedFile) {
                setImageStates(prev => ({
                    ...prev,
                    [typeToUpdate]: { file: capturedFile, previewUrl: imageDataUrl }
                }));
                 // If primary image was just added, move to analysis step
                 if (typeToUpdate === 'primary') {
                    setCaptureMode('webcam'); // Set mode
                    setCurrentStep('analyzingPrimary');
                } else {
                    // If an optional image was added, go to its *analyzing* step
                    const analyzingStep = `analyzing${typeToUpdate.charAt(0).toUpperCase() + typeToUpdate.slice(1)}` as ImageAnalysisStep;
                    goToStep(analyzingStep);
                }
                 // TODO: Trigger analysis for the new image? - Handled by new step transition
            } else {
                toast({ title: "Capture Error", description: "Failed to process captured image.", variant: "destructive" });
            }
        } else {
             toast({ title: "Capture Error", description: "Could not get canvas context.", variant: "destructive" });
             stopWebcam();
        }
    } else {
        toast({ title: "Capture Error", description: "Webcam or active type not ready.", variant: "destructive" });
        stopWebcam();
    }
  };

  // Function to remove an image
  const removeImage = (type: ImageType) => {
      setImageStates(prev => {
          const newState = { ...prev };
          delete newState[type];
          return newState;
      });
      // If removing primary image, potentially clear analysis?
      if (type === 'primary') {
          setAnalysisResult(null);
          setFormData(initialFormData);
      }
  };

  // --- Form Data Handling ---
  // Basic handler for simple fields
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
         ...prev,
         [name]: value 
        }))
  };

  // Handler for numeric fields (e.g., nutrition)
  const handleNumericFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = value === '' ? null : parseFloat(value);
    // Allow empty string or valid numbers, prevent NaN
    if (value === '' || (numValue !== null && !isNaN(numValue))) {
        setFormData(prev => ({
            ...prev,
            [name]: numValue
        }));
    }
  };

  // Handler for type select
  const handleSelectChange = (value: string) => {
    // Ensure the type is one of the valid literals
    if (value === 'food' || value === 'treatment' || value === 'other') {
         setFormData(prev => ({
             ...prev,
             type: value as AnalyzedImageResult['type'] 
            }));
  }
  };

  // Handler for ingredient lists - ADD 'other_ingredients' to listKey union
  const handleIngredientChange = (
    listKey: 'ingredients' | 'active_ingredients' | 'inactive_ingredients' | 'other_ingredients',
    index: number,
    field: 'name' | 'quantity' | 'unit',
    value: string | number | null
  ) => {
    setFormData(prev => {
      if (!prev || !prev[listKey]) return prev;
      const updatedList = [...prev[listKey]!];
      if (!updatedList[index]) return prev;
      const updatedIngredient = { ...updatedList[index] };

      // Update logic needs to handle fields based on listKey type
      if (field === 'name') {
          updatedIngredient.name = typeof value === 'string' ? value : '';
      // Quantity/Unit only relevant for food ingredients and active supplement/treatment ingredients
      } else if ((listKey === 'ingredients' || listKey === 'active_ingredients')) {
          if (field === 'quantity') {
              updatedIngredient.quantity = typeof value === 'number' ? value : null;
          } else if (field === 'unit') {
              updatedIngredient.unit = typeof value === 'string' ? value : null;
          }
      }

      updatedList[index] = updatedIngredient;
      return { ...prev, [listKey]: updatedList };
    });
  };

  // Add ingredient - ADD 'other_ingredients' to listKey union
  const addIngredient = (listKey: 'ingredients' | 'active_ingredients' | 'inactive_ingredients' | 'other_ingredients') => {
    setFormData(prev => {
       if (!prev) return prev;
       const currentList = prev[listKey] || [];
       // Determine structure based on listKey
       const newIngredient = (listKey === 'inactive_ingredients' || listKey === 'other_ingredients') 
                            ? { name: '' } // Only name needed
                            : { name: '', quantity: null, unit: null }; // Full structure needed
       return { ...prev, [listKey]: [ ...currentList, newIngredient ] };
    });
  };

 // Remove ingredient - ADD 'other_ingredients' to listKey union
 const removeIngredient = (listKey: 'ingredients' | 'active_ingredients' | 'inactive_ingredients' | 'other_ingredients', index: number) => {
    setFormData(prev => {
      if (!prev || !prev[listKey]) return prev;
      const updatedList = prev[listKey]!.filter((_, i) => i !== index); 
      return { ...prev, [listKey]: updatedList };
    });
  };

  // Wrapper for the manual analyze button click
  const triggerFullAnalysis = () => {
    handleAnalyzeImages(false); // Call with primaryOnly = false
  };

  // --- Retry Analysis ---
  const handleRetryAnalysis = () => {
    logger.info('Retrying analysis with current images');
    setCurrentStep('analyzingPrimary'); // Show loading spinner
    // Use existing handler, ensuring it analyzes ALL current images
    handleAnalyzeImages(false); 
  };

  // --- Wizard Navigation Helpers ---
  
  // Determines the next logical image capture step or final review
  const determineNextStep = (currentData: Partial<AnalyzedImageResult>): ImageType | 'finalReview' => {
    if (!currentData.type) return 'finalReview'; // Should have type by now

    const relevantOptionalTypes: ImageType[] = [];
    if (currentData.type === 'food') {
      relevantOptionalTypes.push('nutrition', 'ingredients', 'upc');
    } else if (currentData.type === 'treatment') {
      relevantOptionalTypes.push('ingredients', 'upc'); // Dosage/Inactive/Active all under ingredients image
    } else { // 'other'
      relevantOptionalTypes.push('upc');
    }

    // Find the first relevant optional type that hasn't been added yet
    for (const type of relevantOptionalTypes) {
      if (!imageStates[type]) {
        return type; // Return the type name (e.g., 'nutrition')
      }
    }

    return 'finalReview'; // All relevant optional images are added
  };

  // Handles transitioning between wizard steps
  const goToStep = (step: ImageType | ImageAnalysisStep, nextImageType?: ImageType) => {
     logger.debug(`Transitioning to step: ${step}`, { nextImageType });
     if (nextImageType) {
        setActiveImageType(nextImageType); // Set the target image type for capture steps
     }
     setCurrentStep(step as ImageAnalysisStep);
  };

  // Handles going back to recapture an image
  const retakeImage = (type: ImageType) => {
    // Clear the specific image state
    setImageStates(prev => {
      const newState = { ...prev };
      delete newState[type];
      return newState;
    });

    // Determine the correct capture step based on type
    const captureStep = type === 'primary' ? 'capturePrimary' : (`capture${type.charAt(0).toUpperCase() + type.slice(1)}` as ImageAnalysisStep);
    
    logger.info(`Retaking image for type: ${type}, going to step: ${captureStep}`);
    goToStep(captureStep, type); // Go to the capture step for this image type
  };

  // Handler for the renamed "Confirm & Go to Final Review" button
  const handleConfirmAndGoToFinal = () => {
      logger.info("User chose to skip remaining steps and go to final review.");
      goToStep('finalReview');
  };

  // NEW Handler for "Skip This Image & Continue" button
  const handleSkipStepAndContinue = () => {
    const currentSkippedType = activeImageType; // The type of the step we are currently in/skipping
    logger.info(`User chose to skip the current optional step: ${currentSkippedType}`);

    if (!formData.type) {
        logger.warn("Cannot determine next step without formData.type. Going to final review.");
        goToStep('finalReview');
        return;
    }

    const optionalStepsSequence: ImageType[] = [];
    switch (formData.type) {
        case 'food':       optionalStepsSequence.push('nutrition', 'ingredients', 'upc'); break;
        case 'treatment':
        case 'supplement': optionalStepsSequence.push('ingredients', 'upc'); break;
        case 'other':      optionalStepsSequence.push('upc'); break;
    }

    // Find the index of the step being skipped in the sequence for this item type
    const skippedIndex = optionalStepsSequence.findIndex(type => type === currentSkippedType);

    let nextType: ImageType | 'finalReview' = 'finalReview'; // Default to final review
    if (skippedIndex !== -1 && skippedIndex < optionalStepsSequence.length - 1) {
        // If the skipped step is found and it's not the last one in the sequence,
        // find the *next* step in the sequence that hasn't already been captured.
        for (let i = skippedIndex + 1; i < optionalStepsSequence.length; i++) {
            const potentialNextType = optionalStepsSequence[i];
            if (!imageStates[potentialNextType]) { // Check if we don't have an image for this type yet
                nextType = potentialNextType;
                break; // Found the next step to go to
            }
        }
    }
    // If no subsequent optional step is found/needed, nextType remains 'finalReview'

    if (nextType === 'finalReview') {
        logger.info(`Skipped ${currentSkippedType}. No further optional steps, proceeding to final review.`);
        goToStep('finalReview');
    } else {
        // Determine the capture step based on the next image type
        const nextCaptureStep = `capture${nextType.charAt(0).toUpperCase() + nextType.slice(1)}` as ImageAnalysisStep;
        logger.info(`Skipped ${currentSkippedType}. Proceeding to capture step for: ${nextType}`);
        goToStep(nextCaptureStep, nextType);
    }
  };

  // --- Save Action ---
  const handleSave = async () => {
    // Validate required base fields from formData
    if (!formData.type || !formData.name) {
      setSaveError("Type and Name are required.");
      toast({ title: "Save Error", description: "Type and Name are required.", variant: "destructive" });
      return;
    }
    if (!userId) {
      logger.error('handleSave called with no userId');
      toast({ title: "Save Error", description: "User ID is missing.", variant: "destructive" });
      return;
    }

    // Get all files to save
    const filesToSave = Object.entries(imageStates)
        .filter(([/* type */, state]) => state?.file)
        .map(([type, state]) => ({ type: type as ImageType, file: state!.file! }));

    if (filesToSave.length === 0) {
        setSaveError("At least one image is required to save.");
        toast({ title: "Save Error", description: "At least one image is required.", variant: "destructive" });
        return;
    }
    
    setIsSaving(true);
    setSaveError(null);
    setCurrentStep('saving'); // Set step to saving

    const requestFormData = new FormData();
    requestFormData.append('userId', userId);

    // Append all form data fields
    // Need to stringify complex fields like arrays of ingredients
    Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
            // Handle specific types first
            if (Array.isArray(value)) {
                 requestFormData.append(key, JSON.stringify(value));
            } else if (typeof value === 'number') {
                requestFormData.append(key, value.toString());
            } else if (typeof value === 'boolean') { // Explicitly handle boolean
                requestFormData.append(key, value ? 'true' : 'false');
            } else if (typeof value === 'string') {
                 // Only append non-empty strings? Depends on backend validation
                 // if (value.length > 0) {
                     requestFormData.append(key, value);
                 // }
    } else {
                // Log unexpected types but don't break the save
                logger.warn("Skipping unexpected form data type during FormData creation", { key, value, type: typeof value });
            }
        }
    });

    // Append all image files with appropriate keys
    filesToSave.forEach(({ type, file }) => {
      requestFormData.append(`image_${type}`, file);
    });

    try {
      const response = await saveVariableMeasurementsFromImageAction(requestFormData);
      
      if (response.success) {
        logger.info('Variable measurements saved successfully', { data: response.data });
        toast({ title: "Variable Saved", description: `Successfully saved ${formData.name}.` });
        
        // Pass the *final* saved data back if needed (response.data should contain IDs)
        // Or pass the formData which represents the user's final input
        onSaveSuccess?.(formData as AnalyzedImageResult); // Assuming formData is sufficiently complete 
        
        resetState(); // Reset after successful save
        setIsOpen(false); // Close dialog on success
        } else {
        logger.error('Failed to save variable measurements', { error: response.error });
        setSaveError(response.error);
        toast({ title: "Save Failed", description: response.error, variant: "destructive" });
      }
    } catch (err) {
      logger.error('Error calling saveVariableMeasurementsFromImageAction', { error: err });
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setSaveError(`An unexpected error occurred: ${message}`);
      toast({ title: "Error", description: `An unexpected error occurred: ${message}`, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  // --- Render Logic ---
  // Determine which "Add Image" buttons to show based on type
  const getAvailableImageTypes = (): ImageType[] => {
    if (!analysisResult?.type && !formData.type) return ['primary']; // Only primary initially
    const type = formData.type || analysisResult?.type;
    switch (type) {
        case 'food': return ['primary', 'nutrition', 'ingredients', 'upc'];
        case 'treatment': return ['primary', 'ingredients', 'upc']; // Ingredients covers active/inactive/dosage
        case 'other':
        default: return ['primary', 'upc']; // Basic for other
    }
  };

  const availableImageTypes = getAvailableImageTypes();

  // Conditional rendering of form fields based on selected type
  const renderFormFields = () => {
    if (!formData.type) return null;

    return (
      <>
        {/* Common Fields */} 
        <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name*</Label>
            <Input id="name" name="name" value={formData.name || ''} onChange={handleFormChange} className="col-span-3" disabled={isSaving} placeholder="e.g., Cheerios, Advil" required />
        </div>
         <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="brand" className="text-right">Brand</Label>
            <Input id="brand" name="brand" value={formData.brand || ''} onChange={handleFormChange} className="col-span-3" disabled={isSaving} placeholder="e.g., General Mills, Advil" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="upc" className="text-right">UPC</Label>
            <Input id="upc" name="upc" value={formData.upc || ''} onChange={handleFormChange} className="col-span-3" disabled={isSaving} placeholder="Barcode number" />
        </div>
        <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="details" className="text-right pt-2">Details</Label>
            <Textarea id="details" name="details" value={formData.details || ''} onChange={handleFormChange} className="col-span-3" disabled={isSaving} placeholder="Optional additional info" rows={2} />
        </div>

        {/* Food Specific Fields */} 
        {formData.type === 'food' && (
            <>
                <h4 className="col-span-4 text-sm font-medium mt-3 mb-1 border-t pt-3">Nutrition (Per Serving)</h4>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="servingSize_quantity" className="text-right">Serving Size</Label>
                    <Input id="servingSize_quantity" name="servingSize_quantity" type="number" value={formData.servingSize_quantity ?? ''} onChange={handleNumericFormChange} className="col-span-2" disabled={isSaving} placeholder="e.g., 30" />
                    <Input id="servingSize_unit" name="servingSize_unit" value={formData.servingSize_unit || ''} onChange={handleFormChange} className="col-span-1" disabled={isSaving} placeholder="e.g., g" />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="calories_per_serving" className="text-right">Calories</Label>
                    <Input id="calories_per_serving" name="calories_per_serving" type="number" value={formData.calories_per_serving ?? ''} onChange={handleNumericFormChange} className="col-span-3" disabled={isSaving} placeholder="e.g., 110" />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="fat_per_serving" className="text-right">Fat (g)</Label>
                    <Input id="fat_per_serving" name="fat_per_serving" type="number" value={formData.fat_per_serving ?? ''} onChange={handleNumericFormChange} className="col-span-3" disabled={isSaving} placeholder="e.g., 2.5" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="carbs_per_serving" className="text-right">Carbs (g)</Label>
                    <Input id="carbs_per_serving" name="carbs_per_serving" type="number" value={formData.carbs_per_serving ?? ''} onChange={handleNumericFormChange} className="col-span-3" disabled={isSaving} placeholder="e.g., 22" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="protein_per_serving" className="text-right">Protein (g)</Label>
                    <Input id="protein_per_serving" name="protein_per_serving" type="number" value={formData.protein_per_serving ?? ''} onChange={handleNumericFormChange} className="col-span-3" disabled={isSaving} placeholder="e.g., 4" />
                </div>
                {/* TODO: Ingredient List Editing UI */} 
                 <h4 className="col-span-4 text-sm font-medium mt-3 mb-1 border-t pt-3">Ingredients</h4>
                 <div className="col-span-4 space-y-2">
                     {formData.ingredients && formData.ingredients.map((ing, idx) => (
                         <div key={idx} className="flex items-center gap-2">
                             <Input 
                                 value={ing.name} 
                                 onChange={(e) => handleIngredientChange('ingredients', idx, 'name', e.target.value)} 
                                 placeholder="Ingredient Name" 
                                 className="flex-grow"
                                 disabled={isSaving}
                             />
                             {/* Quantity and Unit are less common for general food ingredients - keep simple or add? Let's keep it simple for now */}
                             {/* <Input type="number" value={ing.quantity ?? ''} onChange={(e) => handleIngredientChange('ingredients', idx, 'quantity', e.target.value ? Number(e.target.value) : null)} placeholder="Qty" className="w-16" disabled={isSaving}/>
                             <Input value={ing.unit || ''} onChange={(e) => handleIngredientChange('ingredients', idx, 'unit', e.target.value)} placeholder="Unit" className="w-16" disabled={isSaving}/> */}
                             <Button variant="ghost" size="icon" onClick={() => removeIngredient('ingredients', idx)} disabled={isSaving} aria-label="Remove ingredient">
                                 <Trash2 className="h-4 w-4" />
                             </Button>
                         </div>
                     ))}
                      {(!formData.ingredients || formData.ingredients.length === 0) && (
                        <p className="text-xs text-muted-foreground italic">No ingredients listed.</p>
                     )}
                     <Button variant="outline" size="sm" onClick={() => addIngredient('ingredients')} disabled={isSaving}>
                        Add Ingredient
                    </Button>
                 </div>
            </>
        )}

        {/* Treatment Specific Fields */} 
        {formData.type === 'treatment' && (
            <>
                 <h4 className="col-span-4 text-sm font-medium mt-3 mb-1 border-t pt-3">Dosage & Ingredients</h4>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="dosage_form" className="text-right">Dosage Form</Label>
                    <Input id="dosage_form" name="dosage_form" value={formData.dosage_form || ''} onChange={handleFormChange} className="col-span-3" disabled={isSaving} placeholder="e.g., Tablet, Capsule" />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="dosage_instructions" className="text-right pt-2">Instructions</Label>
                    <Textarea id="dosage_instructions" name="dosage_instructions" value={formData.dosage_instructions || ''} onChange={handleFormChange} className="col-span-3" disabled={isSaving} placeholder="e.g., Take 1 tablet daily" rows={2}/>
                </div>
                <h5 className="col-span-4 text-xs font-medium mt-2">Active Ingredients</h5>
                <div className="col-span-4 space-y-2">
                    {formData.active_ingredients && formData.active_ingredients.map((ing, idx) => (
                         <div key={idx} className="flex items-center gap-2">
                             <Input 
                                 value={ing.name} 
                                 onChange={(e) => handleIngredientChange('active_ingredients', idx, 'name', e.target.value)} 
                                 placeholder="Ingredient Name" 
                                 className="flex-grow"
                                 disabled={isSaving}
                             />
                             <Input 
                                type="number" 
                                value={ing.quantity ?? ''} 
                                onChange={(e) => handleIngredientChange('active_ingredients', idx, 'quantity', e.target.value ? Number(e.target.value) : null)} 
                                placeholder="Strength" 
                                className="w-20" 
                                disabled={isSaving}
                             />
                             <Input 
                                value={ing.unit || ''} 
                                onChange={(e) => handleIngredientChange('active_ingredients', idx, 'unit', e.target.value)} 
                                placeholder="Unit" 
                                className="w-16" 
                                disabled={isSaving}
                             />
                             <Button variant="ghost" size="icon" onClick={() => removeIngredient('active_ingredients', idx)} disabled={isSaving} aria-label="Remove active ingredient">
                                 <Trash2 className="h-4 w-4" />
                             </Button>
                         </div>
                     ))}
                     {(!formData.active_ingredients || formData.active_ingredients.length === 0) && (
                        <p className="text-xs text-muted-foreground italic">No active ingredients listed.</p>
                     )}
                      <Button variant="outline" size="sm" onClick={() => addIngredient('active_ingredients')} disabled={isSaving}>
                        Add Active Ingredient
                    </Button>
                 </div>

                <h5 className="col-span-4 text-xs font-medium mt-2">Inactive Ingredients</h5>
                <div className="col-span-4 space-y-2">
                   {formData.inactive_ingredients && formData.inactive_ingredients.map((ing, idx) => (
                         <div key={idx} className="flex items-center gap-2">
                             <Input 
                                 value={ing.name} 
                                 onChange={(e) => handleIngredientChange('inactive_ingredients', idx, 'name', e.target.value)} 
                                 placeholder="Ingredient Name" 
                                 className="flex-grow"
                                 disabled={isSaving}
                             />
                             {/* Quantity and Unit less common for inactive - omit for simplicity */}
                             <Button variant="ghost" size="icon" onClick={() => removeIngredient('inactive_ingredients', idx)} disabled={isSaving} aria-label="Remove inactive ingredient">
                                 <Trash2 className="h-4 w-4" />
                             </Button>
                         </div>
                     ))}
                      {(!formData.inactive_ingredients || formData.inactive_ingredients.length === 0) && (
                        <p className="text-xs text-muted-foreground italic">No inactive ingredients listed.</p>
                     )}
                      <Button variant="outline" size="sm" onClick={() => addIngredient('inactive_ingredients')} disabled={isSaving}>
                        Add Inactive Ingredient
                    </Button>
                 </div>
            </>
        )}
      </>
    );
  };

  // --- Helper Function to Render Image Capture Buttons --- 
  // Modify to accept and use captureMode
  function renderImageCaptureControls(type: ImageType) {
     const isPrimary = type === 'primary';
     // Use captureMode state to decide which buttons to show after the first step
     const showUpload = captureMode === 'upload' || captureMode === 'undetermined';
     const showWebcam = captureMode === 'webcam' || captureMode === 'undetermined';
     // Only allow switching modes on the primary step *before* an image is added?
     // Or maybe allow switch anytime? For now, let's stick to the initial mode.
     const disableButtons = isAnalyzing || isSaving || isWebcamActive;

     return (
        <div className="w-full max-w-xs space-y-2">
             {imageStates[type]?.previewUrl && (
                 <div className="relative w-full h-32 mt-1">
                    <Image 
                        src={imageStates[type]!.previewUrl!} 
                        alt={`${type} preview`} 
                        fill
                        className="rounded-md border object-contain bg-background" 
                        sizes="(max-width: 768px) 50vw, 250px"
                    />
                     <Button variant="destructive" size="icon" onClick={() => removeImage(type)} disabled={disableButtons} className="absolute top-1 right-1 z-10 h-6 w-6 p-1" aria-label={`Remove ${type} image`}>
                        <Trash2 className="h-4 w-4" />
                     </Button>
                </div>
             )}

             {!imageStates[type] && isWebcamActive && activeImageType === type && (
                <div className="relative mt-1 border rounded-md overflow-hidden bg-black">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-auto max-h-40"
                        style={{ transform: 'scaleX(-1)' }} 
                    />
                    <Button onClick={captureImage} size="sm" className="absolute bottom-1 left-1/2 transform -translate-x-1/2 z-10" aria-label="Capture image">
                        Capture
                    </Button>
                    <Button onClick={stopWebcam} variant="destructive" size="sm" className="absolute top-1 right-1 z-10 p-1 h-auto" aria-label="Stop webcam">
                        <Trash2 className="h-3 w-3" />
                    </Button>
                </div>
            )}

            {/* Upload/Webcam Buttons (Conditional Rendering) */} 
            {/* Only show buttons if no image preview and webcam isn't currently active for this type */} 
            {!imageStates[type] && (!isWebcamActive || activeImageType !== type) && (
                <div className="flex gap-2 mt-1">
                    {/* Show Upload button if mode is upload or undetermined */} 
                    {showUpload && (
                        <Button variant="outline" size="sm" onClick={() => triggerFileInput(type)} disabled={disableButtons} className="flex-1">
                            <Upload className="mr-1.5 h-3.5 w-3.5" /> Upload
                        </Button>
                    )}
                    {/* Show Webcam button if mode is webcam or undetermined */} 
                     {showWebcam && (
                        <Button variant="outline" size="sm" onClick={() => requestWebcam(type)} disabled={disableButtons} className="flex-1">
                            <Camera className="mr-1.5 h-3.5 w-3.5" /> Webcam
                        </Button>
                    )}
                </div>
            )}
            
        </div>
    );
 }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { 
        setIsOpen(open); 
        if (!open) { 
            resetState(); // Reset state on close
        } 
    }}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Camera className="mr-2 h-4 w-4" /> Add Variable via Image
        </Button>
      </DialogTrigger>
      {/* Increased max width for more complex form */} 
      <DialogContent className="sm:max-w-2xl" onInteractOutside={(e) => { if (isSaving) e.preventDefault(); }}>
        <DialogHeader>
          {/* Re-add Title/Description but wrap with VisuallyHidden */} 
          <VisuallyHidden>
            <DialogTitle>Add Variable via Image</DialogTitle>
          </VisuallyHidden>
          <VisuallyHidden>
          <DialogDescription>
              Follow the steps to add images, review details, and save.
          </DialogDescription>
          </VisuallyHidden>
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
          disabled={isAnalyzing || isSaving || isWebcamActive} 
        />
        {/* Hidden Canvas - Keep accessible */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Main Content Area - Now driven by currentStep */} 
        <ScrollArea className="h-[60vh] p-1">
          {currentStep === 'capturePrimary' && (
            <div className="flex flex-col items-center justify-center h-full p-4 space-y-4">
              {/* Add back inner title/description for this step */}
              <h3 className="text-lg font-semibold">Step 1: Add Main Item Image</h3>
              <p className="text-sm text-muted-foreground text-center">Upload or use webcam for the front of package or main view.</p>
              
              {renderImageCaptureControls('primary')}
              
              {/* Image preview can stay if desired */} 
              {imageStates.primary?.previewUrl && (
                 <div className="relative w-48 h-48 mt-4">
                  <Image 
                        src={imageStates.primary.previewUrl} 
                        alt={`primary preview`} 
                    fill
                        className="rounded-md border object-contain bg-background" 
                        sizes="200px"
                  />
              </div>
              )}
            </div>
          )}

          {currentStep === 'analyzingPrimary' && (
            <div className="flex flex-col items-center justify-center h-full p-4 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-lg font-semibold">Analyzing Primary Image...</p>
              <p className="text-sm text-muted-foreground">Extracting item details.</p>
            </div>
          )}

          {currentStep === 'reviewPrimary' && analysisResult && (
            <ReviewPrimaryStep 
              formData={formData}
              primaryImagePreview={imageStates.primary?.previewUrl}
              isSaving={isSaving}
              isAnalyzing={isAnalyzing}
              handleFormChange={handleFormChange}
              handleSelectChange={handleSelectChange}
              determineNextStep={determineNextStep}
              goToStep={goToStep}
              retakeImage={retakeImage}
              onConfirmAndGoToFinal={handleConfirmAndGoToFinal}
            />
          )}

          {currentStep === 'captureNutrition' && (
             <CaptureImageStep 
                stepTitle="Add Nutrition Image"
                stepDescription="Scan or upload nutrition facts."
                imageType='nutrition'
                isSaving={isSaving}
                isAnalyzing={isAnalyzing}
                isWebcamActive={isWebcamActive}
                captureMode={captureMode}
                renderImageCaptureControls={renderImageCaptureControls}
                goToStep={goToStep}
             />
          )}

          {currentStep === 'reviewNutrition' && analysisResult && (
             <ReviewNutritionStep 
                formData={formData}
                nutritionImagePreview={imageStates.nutrition?.previewUrl}
                isSaving={isSaving}
                isAnalyzing={isAnalyzing}
                handleNumericFormChange={handleNumericFormChange}
                handleFormChange={handleFormChange}
                determineNextStep={determineNextStep}
                goToStep={goToStep}
                retakeImage={retakeImage}
                onConfirmAndGoToFinal={handleConfirmAndGoToFinal}
                onSkipStepAndContinue={handleSkipStepAndContinue}
             />
          )}

          {currentStep === 'captureIngredients' && (
             <CaptureImageStep 
                 stepTitle="Add Ingredients Image"
                 stepDescription="Scan or upload ingredients/dosage."
                 imageType='ingredients'
                 isSaving={isSaving}
                 isAnalyzing={isAnalyzing}
                 isWebcamActive={isWebcamActive}
                 captureMode={captureMode}
                 renderImageCaptureControls={renderImageCaptureControls}
                 goToStep={goToStep}
             />
          )}

          {currentStep === 'reviewIngredients' && analysisResult && (
             <ReviewIngredientsStep 
                formData={formData}
                ingredientsImagePreview={imageStates.ingredients?.previewUrl}
                isSaving={isSaving}
                isAnalyzing={isAnalyzing}
                handleFormChange={handleFormChange}
                handleIngredientChange={handleIngredientChange}
                addIngredient={addIngredient}
                removeIngredient={removeIngredient}
                determineNextStep={determineNextStep}
                goToStep={goToStep}
                retakeImage={retakeImage}
                onConfirmAndGoToFinal={handleConfirmAndGoToFinal}
                onSkipStepAndContinue={handleSkipStepAndContinue}
             />
          )}

          {currentStep === 'captureUpc' && (
             <CaptureImageStep 
                 stepTitle="Add UPC Image"
                 stepDescription="Scan or upload barcode."
                 imageType='upc'
                 isSaving={isSaving}
                 isAnalyzing={isAnalyzing}
                 isWebcamActive={isWebcamActive}
                 captureMode={captureMode}
                 renderImageCaptureControls={renderImageCaptureControls}
                 goToStep={goToStep}
             />
          )}

           {currentStep === 'reviewUpc' && analysisResult && (
             <ReviewUpcStep 
                formData={formData}
                upcImagePreview={imageStates.upc?.previewUrl}
                isSaving={isSaving}
                isAnalyzing={isAnalyzing}
                handleFormChange={handleFormChange}
                goToStep={goToStep}
                retakeImage={retakeImage}
                onConfirmAndGoToFinal={handleConfirmAndGoToFinal}
                onSkipStepAndContinue={handleConfirmAndGoToFinal}
             />
          )}

          {currentStep === 'finalReview' && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column: Image Previews */}
                 <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Images</h3>
                    {IMAGE_TYPES.filter(type => imageStates[type]).map((type) => (
                        <div key={type} className="border p-3 rounded-md space-y-2 bg-muted/30">
                           <div className="flex justify-between items-center">
                             <Label htmlFor={`image-review-${type}`} className="capitalize font-medium flex items-center">
                                <ImageIcon className="mr-2 h-4 w-4 text-muted-foreground"/> {type}
                             </Label>
                              <Button variant="ghost" size="sm" onClick={() => removeImage(type)} aria-label={`Remove ${type} image`}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                           </div>
                           {imageStates[type]?.previewUrl && (
                             <div className="relative w-full h-32 mt-1">
                                <Image 
                                    src={imageStates[type]!.previewUrl!} 
                                    alt={`${type} preview`} 
                                    fill
                                    className="rounded-md border object-contain bg-background" 
                                    sizes="(max-width: 768px) 50vw, 250px"
                                />
                              </div>
                           )}
                        </div>
                    ))}
                    {/* Optionally add buttons here to go back and add more images? */} 
                 </div>
                {/* Right Column: Full Form */} 
                 <div className="space-y-3">
                     <h3 className="text-lg font-semibold">Details</h3>
                     {/* Type Selection - Allow final confirmation/change */}
               <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="type-review" className="text-right">Type*</Label>
                  <Select 
                            name="type" value={formData.type || ''} 
                            onValueChange={handleSelectChange} disabled={isSaving}
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
                     {/* Render the actual form fields using the existing function */}
                     {formData.type ? renderFormFields() : (
                        <p className="text-sm text-muted-foreground italic text-center py-4">
                            Select a type to see details.
                        </p>
                    )}
          {saveError && (
            <div className="text-red-600 text-sm flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-md mt-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>Save Error: {saveError}</span>
            </div>
          )}
        </div>
            </div>
          )}
          
          {currentStep === 'saving' && (
             <div className="flex flex-col items-center justify-center h-full p-4 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-lg font-semibold">Saving...</p>
            </div>
          )}

        </ScrollArea>

        <DialogFooter className="mt-4 pt-4 border-t">
          {/* Close Button - Always available unless saving */} 
          <DialogClose asChild>
            <Button 
              type="button" 
              variant="outline" 
              disabled={isSaving || isAnalyzing}
              onClick={resetState} // Ensure reset on explicit cancel too
            >Cancel</Button>
          </DialogClose>

          {/* finalReview step button remains */}
          {currentStep === 'finalReview' && (
          <Button 
            type="button" 
            onClick={handleSave} 
              disabled={isAnalyzing || isSaving || !formData.type || !formData.name || Object.keys(imageStates).length === 0}
           >
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save Variable'} 
          </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 
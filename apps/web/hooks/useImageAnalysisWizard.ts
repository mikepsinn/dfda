import { useReducer, useCallback } from 'react';
import { useWebcam } from '@/hooks/useWebcam';
import { AnalyzedImageResult, analyzeImageAction } from '@/lib/actions/analyze-image';
import { saveVariableMeasurementsFromImageAction } from '@/lib/actions/save-variable-measurements-from-image';
import { logger } from '@/lib/logger';
import { toast } from '@/components/ui/use-toast';
import { ImageType, ImageAnalysisStep } from '@/components/shared/ImageAnalysisCapture';

// Define ALL_IMAGE_ANALYSIS_STEPS for step validation
const ALL_IMAGE_ANALYSIS_STEPS: ImageAnalysisStep[] = [
    'capturePrimary', 'analyzingPrimary', 'reviewPrimary',
    'captureNutrition', 'analyzingNutrition', 'reviewNutrition',
    'captureIngredients', 'analyzingIngredients', 'reviewIngredients',
    'captureUpc', 'analyzingUpc', 'reviewUpc',
    'finalReview', 'saving', 'error'
];

// Define state types
interface ImageState {
  file: File;
  previewUrl: string;
}

interface WizardState {
  currentStep: ImageAnalysisStep;
  imageStates: Partial<Record<ImageType, ImageState>>;
  formData: Partial<AnalyzedImageResult>;
  analysisResult: AnalyzedImageResult | null;
  captureMode: 'upload' | 'webcam' | 'undetermined';
  activeImageType: ImageType | null;
  isLoading: boolean;
  error: string | null;
  saveSuccessful: boolean;
}

// Define action types
type WizardAction =
  | { type: 'RESET' }
  | { type: 'GO_TO_STEP'; payload: ImageAnalysisStep }
  | { type: 'SET_CAPTURE_MODE'; payload: 'upload' | 'webcam' | 'undetermined' }
  | { type: 'IMAGE_UPLOADED'; payload: { type: ImageType; file: File; previewUrl: string } }
  | { type: 'START_ANALYSIS'; payload: { primaryOnly: boolean } }
  | { type: 'ANALYSIS_SUCCESS'; payload: AnalyzedImageResult }
  | { type: 'ANALYSIS_ERROR'; payload: string }
  | { type: 'UPDATE_FORM_FIELD'; payload: { field: keyof Partial<AnalyzedImageResult>; value: any } }
  | { type: 'START_SAVE' }
  | { type: 'SAVE_SUCCESS' }
  | { type: 'SAVE_ERROR'; payload: string }
  | { type: 'REMOVE_IMAGE'; payload: ImageType }
  | { type: 'SET_ACTIVE_IMAGE_TYPE'; payload: ImageType }
  | { type: 'RETRY_LAST_ACTION' };

// Define initial state
const initialState: WizardState = {
  currentStep: 'capturePrimary',
  imageStates: {},
  formData: {},
  analysisResult: null,
  captureMode: 'undetermined',
  activeImageType: 'primary',
  isLoading: false,
  error: null,
  saveSuccessful: false,
};

// Define reducer function
function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  logger.debug('Wizard Reducer Action:', { actionType: action.type, currentState: state.currentStep });
  switch (action.type) {
    case 'RESET':
      return initialState;

    case 'GO_TO_STEP':
      // Only clear error state when not going to an analyzing step
      // This allows error messages to persist during analysis
      const shouldClearError = !action.payload.startsWith('analyzing');
      return { 
        ...state, 
        currentStep: action.payload, 
        error: shouldClearError ? null : state.error
      };

    case 'SET_CAPTURE_MODE':
      if (state.captureMode === 'undetermined') {
        return { ...state, captureMode: action.payload };
      }
      logger.warn('Attempted to set capture mode when already determined', { current: state.captureMode, attempted: action.payload });
      return state;

    case 'IMAGE_UPLOADED': {
      const { type, file, previewUrl } = action.payload;
      // Log file details for debugging
      logger.info(`Image uploaded for type: ${type}, file size: ${file.size} bytes`, {
        fileType: file.type,
        fileName: file.name,
        lastModified: new Date(file.lastModified).toISOString()
      });
      
      // Create a deep copy of current imageStates to ensure state integrity
      const updatedImageStates = {...state.imageStates};
      
      // Set the new image state for this type
      updatedImageStates[type] = { 
        file: file, 
        previewUrl: previewUrl 
      };
      
      // Log the updated state keys for debugging
      logger.info(`Updated imageStates now contains: ${Object.keys(updatedImageStates).join(', ')}`);
      
      return {
        ...state,
        imageStates: updatedImageStates,
        error: null,
      };
    }

    case 'START_ANALYSIS': {
      const nextStep = action.payload.primaryOnly ? 'analyzingPrimary' : `analyzing${state.activeImageType?.charAt(0).toUpperCase()}${state.activeImageType?.slice(1)}` as ImageAnalysisStep;
      logger.info(`Starting analysis, moving to step: ${nextStep}`);
      logger.info('Current imageStates when starting analysis:', {
        stateKeys: Object.keys(state.imageStates),
        hasPrimary: !!state.imageStates.primary?.file,
        primarySize: state.imageStates.primary?.file?.size
      });
      return { 
        ...state, 
        isLoading: true, 
        error: null, 
        currentStep: nextStep,
        // Explicitly preserve the imageStates to prevent any accidental clearing
        imageStates: { ...state.imageStates }
      };
    }

    case 'ANALYSIS_SUCCESS': {
      const analysisType = state.currentStep.startsWith('analyzing') 
                          ? state.currentStep.replace('analyzing', '').toLowerCase() as ImageType
                          : 'primary';
      const reviewStep = `review${analysisType.charAt(0).toUpperCase() + analysisType.slice(1)}` as ImageAnalysisStep;
      logger.info(`Analysis successful, moving to review step: ${reviewStep}`);

      return {
        ...state,
        isLoading: false,
        analysisResult: action.payload,
        formData: { ...action.payload },
        currentStep: ALL_IMAGE_ANALYSIS_STEPS.includes(reviewStep) ? reviewStep : 'finalReview',
      };
    }

    case 'ANALYSIS_ERROR': {
      const failedAnalysisType = state.currentStep.startsWith('analyzing') 
                                ? state.currentStep.replace('analyzing', '').toLowerCase() as ImageType
                                : state.activeImageType ?? 'primary'; 
      const captureStep = `capture${failedAnalysisType.charAt(0).toUpperCase() + failedAnalysisType.slice(1)}` as ImageAnalysisStep;
      logger.error(`Analysis failed, returning to capture step: ${captureStep}`, { error: action.payload });
      return {
        ...state,
        isLoading: false,
        error: action.payload,
        currentStep: ALL_IMAGE_ANALYSIS_STEPS.includes(captureStep) ? captureStep : 'capturePrimary',
      };
    }

    case 'UPDATE_FORM_FIELD': {
      const { field, value } = action.payload;
      return {
        ...state,
        formData: { ...state.formData, [field]: value },
      };
    }

    case 'START_SAVE':
      logger.info('Starting save process');
      return { ...state, isLoading: true, error: null, currentStep: 'saving' };

    case 'SAVE_SUCCESS':
      logger.info('Save completed successfully');
      return { 
        ...state, 
        isLoading: false, 
        error: null, 
        currentStep: 'finalReview',
        saveSuccessful: true
      };

    case 'SAVE_ERROR':
      logger.error('Save failed', { error: action.payload });
      return { ...state, isLoading: false, error: action.payload, currentStep: 'finalReview' };

    case 'RETRY_LAST_ACTION':
      logger.info('Retrying last action, clearing error state');
      return { ...state, error: null, isLoading: false };

    case 'REMOVE_IMAGE': {
      const typeToRemove = action.payload;
      const { [typeToRemove]: _, ...remainingImages } = state.imageStates;
      const shouldClearAnalysis = typeToRemove === 'primary';
      logger.info(`Removing image of type: ${typeToRemove}, clearing analysis: ${shouldClearAnalysis}`);
      return {
        ...state,
        imageStates: remainingImages,
        analysisResult: shouldClearAnalysis ? null : state.analysisResult,
        formData: shouldClearAnalysis ? { ...initialState.formData, type: state.formData.type } : state.formData,
      };
    }

    case 'SET_ACTIVE_IMAGE_TYPE':
      logger.info(`Setting active image type to: ${action.payload}`);
      return { ...state, activeImageType: action.payload };

    default:
      return state;
  }
}

// Define hook with named export
export function useImageAnalysisWizard(
  userId: string,
  onSaveSuccess?: (data: AnalyzedImageResult) => void
) {
  const [state, dispatch] = useReducer(wizardReducer, initialState);

  const updateFormField = useCallback(
    (field: keyof Partial<AnalyzedImageResult>, value: any) => {
      dispatch({ type: 'UPDATE_FORM_FIELD', payload: { field, value } });
    },
    []
  );

  // Add goToStep action
  const goToStep = useCallback((step: ImageAnalysisStep) => {
    logger.info(`Navigation requested to step: ${step} from current step: ${state.currentStep}`);
    
    // Check if this is a valid step based on current state
    // For example, can't go to analyzing without images
    if (step.startsWith('analyzing')) {
      const imageType = step === 'analyzingPrimary' 
        ? 'primary' 
        : step.replace('analyzing', '').toLowerCase() as ImageType;
      
      // Get the current image state for the type
      const imageState = state.imageStates[imageType];
      logger.info(`Checking image for ${imageType} before navigating to ${step}`, {
        imageExists: !!imageState,
        hasFile: !!imageState?.file,
        fileSize: imageState?.file?.size,
        hasPreviewUrl: !!imageState?.previewUrl
      });
      
      // Special case: Allow direct navigation to analyzing steps if we're coming from analyzeImages
      // This is used when we're manually triggering analysis with a direct file reference
      const callerFunction = new Error().stack?.split('\n')[2] || '';
      const isCalledFromAnalyzeImages = callerFunction.includes('analyzeImages');
      
      if (!imageState?.file && !isCalledFromAnalyzeImages) {
        logger.warn(`Cannot navigate to analyzing step ${step} - no image for ${imageType}`);
        return;
      }
      
      if (isCalledFromAnalyzeImages) {
        logger.info(`Special case: Allowing navigation to ${step} from analyzeImages function`);
      } else {
        logger.info(`Navigation to analyzing step ${step} is valid - image exists for ${imageType}`);
      }
    }
    
    dispatch({ type: 'GO_TO_STEP', payload: step });
    logger.info(`Successfully navigated to step: ${step}`);
  }, [dispatch, state.currentStep, state.imageStates]);

  // Add setCaptureMode action
  const setCaptureMode = useCallback(
    (mode: 'upload' | 'webcam' | 'undetermined') => {
      logger.info(`Setting capture mode: ${mode}`);
      dispatch({ type: 'SET_CAPTURE_MODE', payload: mode });
    },
    []
  );

  // Add setActiveImageType action
  const setActiveImageType = useCallback((type: ImageType) => {
    dispatch({ type: 'SET_ACTIVE_IMAGE_TYPE', payload: type });
  }, []);

  // Initialize webcam hook
  const {
    videoRef,
    canvasRef,
    isWebcamActive,
    webcamStream,
    requestWebcam: hookRequestWebcam,
    stopWebcam: hookStopWebcam,
    captureImage: hookCaptureImage,
  } = useWebcam();

  // Add requestWebcam action
  const requestWebcam = useCallback(async (type: ImageType) => {
    logger.info(`Requesting webcam for image type: ${type}`);
    setActiveImageType(type);
    const success = await hookRequestWebcam();
    if (!success) {
      logger.warn('Webcam request failed, resetting to primary type');
      setActiveImageType('primary');
    }
    return success;
  }, [hookRequestWebcam, setActiveImageType]);

  // Add captureImage action
  const captureImage = useCallback(async () => {
    const typeToUpdate = state.activeImageType;
    if (!typeToUpdate) {
      logger.error('captureImage called without activeImageType set in state.');
      toast({ title: "Capture Error", description: "Internal error: Image type not set.", variant: "destructive" });
      hookStopWebcam();
      return null;
    }

    logger.info(`Capturing image for type: ${typeToUpdate}`);
    const captureResult = await hookCaptureImage();
    if (captureResult) {
      const { file: capturedFile, previewUrl: imageDataUrl } = captureResult;
      logger.info(`Image successfully captured, size: ${capturedFile.size} bytes`);
      dispatch({ type: 'IMAGE_UPLOADED', payload: { type: typeToUpdate, file: capturedFile, previewUrl: imageDataUrl } });
      return captureResult;
    } else {
      logger.warn(`Image capture failed for type: ${typeToUpdate}`);
      return null;
    }
  }, [state.activeImageType, hookCaptureImage, hookStopWebcam]);

  // Add uploadImage action
  const uploadImage = useCallback(
    async (type: ImageType, file: File, previewUrl: string) => {
      logger.info(`Uploading image for type: ${type}, size: ${file.size} bytes, type: ${file.type}`);
      
      // Verify the file exists and has content
      if (!file || file.size === 0) {
        logger.error(`Attempted to upload invalid file for ${type}: file is null or empty`);
        return false;
      }
      
      // Dispatch the action to update state
      dispatch({ type: 'IMAGE_UPLOADED', payload: { type, file, previewUrl } });
      
      // Wait a moment for state to update
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Log state update confirmation
      logger.info(`Image for ${type} has been uploaded to state`);
      return true;
    },
    []
  );

  // Add analyzeImages action
  const analyzeImages = async (primaryOnly: boolean = false, directPrimaryFile?: File) => {
    logger.info(`analyzeImages called with primaryOnly=${primaryOnly}${directPrimaryFile ? ', using direct file' : ''}`);
    
    // First ensure we're in the analyzing state
    const nextStep = primaryOnly 
      ? 'analyzingPrimary' 
      : `analyzing${state.activeImageType?.charAt(0).toUpperCase()}${state.activeImageType?.slice(1)}` as ImageAnalysisStep;
    
    // Navigate to analyzing step first to show loading UI
    dispatch({ type: 'GO_TO_STEP', payload: nextStep });
    
    // THEN start analysis
    dispatch({ type: 'START_ANALYSIS', payload: { primaryOnly } });
    
    logger.info('Current imageStates before analysis:', { 
      stateKeys: Object.keys(state.imageStates),
      hasPrimary: !!state.imageStates.primary?.file || !!directPrimaryFile,
      primarySize: (state.imageStates.primary?.file?.size || directPrimaryFile?.size)
    });

    // Gather files to analyze
    let filesToAnalyze: { type: ImageType; file: File }[] = [];
    
    if (primaryOnly) {
      // Use direct file if provided, otherwise use from state
      if (directPrimaryFile) {
        logger.info(`Using direct primary file: ${directPrimaryFile.size} bytes, ${directPrimaryFile.type}`);
        filesToAnalyze = [{ type: 'primary', file: directPrimaryFile }];
      } else {
        const primaryState = state.imageStates.primary;
        if (!primaryState?.file) {
          logger.error('Primary image is missing for analysis and no direct file provided');
          dispatch({ type: 'ANALYSIS_ERROR', payload: 'Primary image is required for analysis.' });
          return;
        }
        logger.info('Analyzing primary image from state');
        filesToAnalyze = [{ type: 'primary', file: primaryState.file }];
      }
    } else {
      logger.info('Gathering all available images for analysis');
      filesToAnalyze = Object.entries(state.imageStates)
        .filter(([, img]) => img?.file)
        .map(([t, img]) => ({ type: t as ImageType, file: img!.file }));
      
      logger.info(`Found ${filesToAnalyze.length} images to analyze: ${filesToAnalyze.map(f => f.type).join(', ')}`);
      
      if (filesToAnalyze.length === 0) {
        logger.error('No images available for analysis');
        dispatch({ type: 'ANALYSIS_ERROR', payload: 'No images available to analyze.' });
        return;
      }
    }

    const formDataObj = new FormData();
    filesToAnalyze.forEach(({ type, file }) => {
      logger.info(`Adding image_${type} to form data, size: ${file.size} bytes`);
      formDataObj.append(`image_${type}`, file);
    });

    try {
      logger.info('Sending images for analysis to API');
      const result = await analyzeImageAction(formDataObj);
      if (result.success) {
        logger.info('Image analysis successful', { resultKeys: Object.keys(result.data) });
        dispatch({ type: 'ANALYSIS_SUCCESS', payload: result.data });
      } else {
        logger.error('Image analysis failed', { error: result.error });
        dispatch({ type: 'ANALYSIS_ERROR', payload: result.error });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unexpected analysis error.';
      logger.error('Exception during image analysis', { error: message });
      dispatch({ type: 'ANALYSIS_ERROR', payload: message });
    }
  };

  // Add saveWizardData action
  const saveWizardData = async () => {
    logger.info('Starting to save wizard data');
    dispatch({ type: 'START_SAVE' });
    const requestFormData = new FormData();
    requestFormData.append('userId', userId);

    // Append form data fields
    Object.entries(state.formData).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (Array.isArray(value)) {
          requestFormData.append(key, JSON.stringify(value));
        } else {
          requestFormData.append(key, String(value));
        }
      }
    });

    // Append image files
    Object.entries(state.imageStates).forEach(([t, img]) => {
      if (img?.file) {
        logger.info(`Adding image_${t} to form data for saving, size: ${img.file.size} bytes`);
        requestFormData.append(`image_${t}`, img.file);
      }
    });

    try {
      logger.info('Sending save request to API');
      const response = await saveVariableMeasurementsFromImageAction(requestFormData);
      if (response.success) {
        logger.info('Save operation successful');
        dispatch({ type: 'SAVE_SUCCESS' });
        toast({ title: "Variable Saved", description: `Successfully saved ${state.formData.name || 'item'}.` });
        onSaveSuccess?.(state.formData as AnalyzedImageResult);
      } else {
        logger.error('Save operation failed', { error: response.error });
        dispatch({ type: 'SAVE_ERROR', payload: response.error });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unexpected save error.';
      logger.error('Exception during save operation', { error: message });
      dispatch({ type: 'SAVE_ERROR', payload: message });
    }
  };

  // Add resetWizard action
  const resetWizard = useCallback(() => {
    logger.info('Resetting wizard to initial state');
    dispatch({ type: 'RESET' });
  }, []);

  // Add removeImage action
  const removeImage = useCallback((type: ImageType) => {
    logger.info(`Removing image of type: ${type}`);
    dispatch({ type: 'REMOVE_IMAGE', payload: type });
    if (type === state.activeImageType) {
      logger.info('Removed active image type, returning to primary capture');
      goToStep('capturePrimary');
    }
  }, [state.activeImageType, goToStep]);

  // Add retakeImage action
  const retakeImage = useCallback((type: ImageType) => {
    logger.info(`Retaking image of type: ${type}`);
    // First remove the image
    removeImage(type);
    // Then go to the appropriate capture step
    const captureStep = `capture${type.charAt(0).toUpperCase() + type.slice(1)}` as ImageAnalysisStep;
    if (ALL_IMAGE_ANALYSIS_STEPS.includes(captureStep)) {
      logger.info(`Navigating to capture step: ${captureStep}`);
      goToStep(captureStep);
    } else {
      logger.info('Invalid capture step, falling back to primary capture');
      goToStep('capturePrimary'); // Fallback
    }
  }, [removeImage, goToStep]);

  // Add goToNextStepFromReview action (for smart transitions)
  const goToNextStepFromReview = useCallback((currentImageType: ImageType) => {
    logger.info(`Determining next step from review of: ${currentImageType}`);
    // Determine next step based on current image type and form data
    let nextImageType: ImageType | 'finalReview' = 'finalReview';
    
    // Consider form data type for logic
    if (state.formData.type) {
      if (currentImageType === 'primary') {
        if (state.formData.type === 'food') nextImageType = 'nutrition';
        else if (state.formData.type === 'treatment') nextImageType = 'ingredients';
        else nextImageType = 'upc'; // Default for supplement/other
      } 
      else if (currentImageType === 'nutrition' || currentImageType === 'ingredients') {
        nextImageType = 'upc';
      }
      else {
        nextImageType = 'finalReview';
      }
    }
    
    logger.info(`Smart navigation decided next type: ${nextImageType}`);
    
    // Navigate to next step
    if (nextImageType === 'finalReview') {
      logger.info('Navigating to final review');
      goToStep('finalReview');
    } else {
      const nextCaptureStep = `capture${nextImageType.charAt(0).toUpperCase() + nextImageType.slice(1)}` as ImageAnalysisStep;
      logger.info(`Navigating to next capture step: ${nextCaptureStep}`);
      goToStep(nextCaptureStep);
      setActiveImageType(nextImageType);
    }
  }, [state.formData.type, goToStep, setActiveImageType]);

  // Add retryLastAction
  const retryLastAction = useCallback(() => {
    logger.info('Attempting to retry last failed action');
    // First clear error state via the reducer
    dispatch({ type: 'RETRY_LAST_ACTION' });
    
    // Determine what action failed based on the current step
    // and retry that specific action
    const currentStep = state.currentStep;
    
    if (currentStep === 'finalReview') {
      // If we're on finalReview, most likely a save operation failed
      logger.info('Detected failure in final review, retrying save operation');
      // Schedule this to run after the state update to prevent issues
      setTimeout(() => saveWizardData(), 0);
    } 
    else if (currentStep.startsWith('capture') && currentStep !== 'capturePrimary') {
      // If we failed during analysis and got sent back to capture step (except primary)
      // Re-analyze with the current active type
      const activeType = state.activeImageType;
      logger.info(`Detected failure in analysis, retrying with active type: ${activeType}`);
      setTimeout(() => analyzeImages(activeType === 'primary'), 0);
    }
  }, [dispatch, state.currentStep, state.activeImageType, saveWizardData, analyzeImages]);

  return {
    state,
    actions: {
      goToStep,
      setCaptureMode,
      updateFormField,
      requestWebcam,
      stopWebcam: hookStopWebcam,
      captureImage,
      analyzeImages,
      saveWizardData,
      resetWizard,
      uploadImage,
      removeImage,
      retakeImage,
      setActiveImageType,
      goToNextStepFromReview,
      retryLastAction,
    },
    refs: {
      videoRef,
      canvasRef,
    },
    webcam: {
      isWebcamActive,
      webcamStream,
    },
  };
}
'use client'

import React, { useState, useRef, useCallback } from 'react'
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

// Define image types based on the plan
const IMAGE_TYPES = ['primary', 'nutrition', 'ingredients', 'upc'] as const;
type ImageType = typeof IMAGE_TYPES[number];

// Helper type for image state
type ImageState = { file: File | null; previewUrl: string | null };

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

export function ImageAnalysisCapture({ userId, onSaveSuccess }: ImageAnalysisCaptureProps) {
  const [isOpen, setIsOpen] = useState(false)
  // State for multiple images
  const [imageStates, setImageStates] = useState<Partial<Record<ImageType, ImageState>>>({})
  // State for which image type is currently being captured/uploaded
  const [activeImageType, setActiveImageType] = useState<ImageType>('primary') 
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

  // Reset state needs to clear multiple images and full form data
  const resetState = useCallback(() => {
    setImageStates({});
    setActiveImageType('primary');
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
    if (file && activeImageType) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setImageStates(prev => ({
                ...prev,
                [activeImageType]: { file: file, previewUrl: reader.result as string }
            }));
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
  const handleAnalyzeImages = async () => {
    const filesToAnalyze = Object.entries(imageStates)
      .filter(([/* type */, state]) => state?.file)
      .map(([type, state]) => ({ type: type as ImageType, file: state!.file! }));

    if (filesToAnalyze.length === 0 || !imageStates.primary?.file) {
      setAnalysisError("Primary image is required to start analysis.");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null); // Clear previous results

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
        });
        toast({ title: "Analysis Complete", description: `Identified as ${result.data.type}: ${result.data.name}` });
      } else {
        setAnalysisError(result.error);
        toast({ title: "Analysis Failed", description: result.error, variant: "destructive" });
      } 
    } catch (err) {
      logger.error("Client-side error calling analyzeImageAction", { error: err });
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      setAnalysisError(message);
      toast({ title: "Analysis Error", description: message, variant: "destructive" });
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
            const filename = `webcam-${activeImageType}-${timestamp}.jpg`;
            const capturedFile = dataURLtoFile(imageDataUrl, filename);
            
            if (capturedFile) {
                setImageStates(prev => ({
                    ...prev,
                    [activeImageType]: { file: capturedFile, previewUrl: imageDataUrl }
                }));
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
                 <div className="col-span-4 text-xs text-muted-foreground p-2 border rounded-md">
                    {formData.ingredients && formData.ingredients.length > 0 
                        ? formData.ingredients.map((ing, idx) => (
                            <span key={idx} className="inline-block mr-1">{ing.name}{idx < formData.ingredients!.length - 1 ? ", " : ""}</span>
                          )) 
                        : "(No ingredients extracted)"
                    }
                    {/* Add button to manually edit/add ingredients */} 
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
                {/* TODO: Active Ingredient List Editing UI */} 
                <h5 className="col-span-4 text-xs font-medium mt-2">Active Ingredients</h5>
                 <div className="col-span-4 text-xs text-muted-foreground p-2 border rounded-md">
                    {formData.active_ingredients && formData.active_ingredients.length > 0 
                        ? formData.active_ingredients.map((ing, idx) => (
                            <span key={idx} className="inline-block mr-1">{ing.name} {ing.quantity}{ing.unit}{idx < formData.active_ingredients!.length - 1 ? ", " : ""}</span>
                          )) 
                        : "(No active ingredients extracted)"
                    }
                    {/* Add button */} 
                 </div>
                {/* TODO: Inactive Ingredient List Editing UI */} 
                <h5 className="col-span-4 text-xs font-medium mt-2">Inactive Ingredients</h5>
                 <div className="col-span-4 text-xs text-muted-foreground p-2 border rounded-md">
                   {formData.inactive_ingredients && formData.inactive_ingredients.length > 0 
                        ? formData.inactive_ingredients.map((ing, idx) => (
                            <span key={idx} className="inline-block mr-1">{ing.name}{idx < formData.inactive_ingredients!.length - 1 ? ", " : ""}</span>
                          )) 
                        : "(No inactive ingredients extracted)"
                    }
                    {/* Add button */} 
                 </div>
            </>
        )}
      </>
    );
  };


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
          <DialogTitle>Analyze Image and Add Variable</DialogTitle>
          <DialogDescription>
            Add images (front, nutrition, ingredients, UPC). Analyze to extract data, then edit and save the variable.
          </DialogDescription>
        </DialogHeader>
        
        {/* Hidden file input */}
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

        {/* Main Content Area */} 
        <ScrollArea className="h-[60vh] p-1">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Image Management */} 
            <div className="space-y-4">
                 <h3 className="text-lg font-semibold">Images</h3>
                 {IMAGE_TYPES.map((type) => {
                    const image = imageStates[type];
                    const isAvailable = availableImageTypes.includes(type);
                    // Only show add button if type is available and image not already added
                    const showAddButton = isAvailable && !image;
                    // Don't show Add button for primary if webcam is active for it
                    const disableAdd = isWebcamActive && activeImageType === type;
                    return (
                        <div key={type} className="border p-3 rounded-md space-y-2 bg-muted/30">
                           <div className="flex justify-between items-center">
                             <Label htmlFor={`image-${type}`} className="capitalize font-medium flex items-center">
                                <ImageIcon className="mr-2 h-4 w-4 text-muted-foreground"/> 
                                {type} {type === 'primary' ? '*' : ''}
                             </Label>
                             {image && (
                                <Button variant="ghost" size="sm" onClick={() => removeImage(type)} aria-label={`Remove ${type} image`}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                             )}
                           </div>
                           {image?.previewUrl && (
                             <div className="relative w-full h-32 mt-1">
                                <Image 
                                    src={image.previewUrl} 
                                    alt={`${type} preview`} 
                                    fill
                                    className="rounded-md border object-contain bg-background" 
                                    sizes="(max-width: 768px) 50vw, 250px"
                                />
                            </div>
                           )}
                            {!image && isWebcamActive && activeImageType === type && (
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
                            {showAddButton && !disableAdd && (
                                <div className="flex gap-2 mt-1">
                                    <Button variant="outline" size="sm" onClick={() => triggerFileInput(type)} disabled={isAnalyzing || isSaving} className="flex-1">
                                        <Upload className="mr-1.5 h-3.5 w-3.5" /> Upload
                                    </Button>
                                     {/* Enable webcam only for types where it makes sense? Primarily for 'primary'? */} 
                                    {/* <Button variant="outline" size="sm" onClick={() => requestWebcam(type)} disabled={isAnalyzing || isSaving || isWebcamActive} className="flex-1">
                                        <Camera className="mr-1.5 h-3.5 w-3.5" /> Webcam
                                    </Button> */} 
                                    {/* Simplified: Only show webcam button if not active */} 
                                    {!isWebcamActive && (
                                        <Button variant="outline" size="sm" onClick={() => requestWebcam(type)} disabled={isAnalyzing || isSaving} className="flex-1">
                                            <Camera className="mr-1.5 h-3.5 w-3.5" /> Webcam
                                        </Button>
                                    )}
                                </div>
                            )}
                            {!isAvailable && !image && (
                                <p className="text-xs text-muted-foreground italic">(Upload primary image first)</p>
                            )}
                        </div>
                    );
                 })}
                 {/* Analyze Button */} 
                 <Button 
                    onClick={handleAnalyzeImages} 
                    disabled={isAnalyzing || isSaving || !imageStates.primary?.file} 
                    className="w-full mt-4"
                    >
                    {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Analyze Image(s)
                 </Button>
                 {analysisError && (
                    <div className="text-red-600 text-sm flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-md mt-2">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        <span>Analysis Error: {analysisError}</span>
                    </div>
                )}
            </div>

            {/* Right Column: Form Fields */} 
            <div className="space-y-3">
                 <h3 className="text-lg font-semibold">Extracted Details</h3>
                 {/* Type Selection - Always show if analysis hasn't happened or allows override */} 
                 <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">Type*</Label>
                  <Select 
                    name="type"
                    value={formData.type || ''} 
                    onValueChange={handleSelectChange}
                    disabled={isSaving}
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

                {/* Render specific fields based on selected type */} 
                {formData.type ? renderFormFields() : (
                    <p className="text-sm text-muted-foreground italic text-center py-4">
                        {analysisResult ? "Edit the extracted details below." : "Select a type or analyze images to see details."}
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
         {/* Hidden Canvas */} 
         <canvas ref={canvasRef} style={{ display: 'none' }} />
        </ScrollArea>

        <DialogFooter className="mt-4 pt-4 border-t">
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isSaving}>Cancel</Button>
          </DialogClose>
          <Button 
            type="button" 
            onClick={handleSave} 
            disabled={isAnalyzing || isSaving || !formData.type || !formData.name || Object.keys(imageStates).length === 0}
           >
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Variable
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Upload, AlertCircle, Camera } from 'lucide-react'
import { analyzeImageAction, AnalyzedImageResult } from '@/lib/actions/analyze-image'
// We will create this action next
import { saveItemFromImageAction } from '@/lib/actions/save-item-from-image'
import { logger } from '@/lib/logger'
import { toast } from '@/components/ui/use-toast'
import Image from 'next/image'

interface ImageAnalysisCaptureProps {
  userId: string // Pass the user ID for saving
  onSaveSuccess?: (data: AnalyzedImageResult) => void // Optional callback after successful save
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

export function ImageAnalysisCapture({ userId, onSaveSuccess }: ImageAnalysisCaptureProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [analysisResult, setAnalysisResult] = useState<AnalyzedImageResult | null>(null)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Webcam state
  const [isWebcamActive, setIsWebcamActive] = useState(false)
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null)
  // Use previewUrl for both uploaded and captured images
  // const [capturedImageDataUrl, setCapturedImageDataUrl] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null) // For capturing the frame

  // Form state for editing analysis results
  const [formData, setFormData] = useState<Partial<AnalyzedImageResult & { type: 'food' | 'treatment' | 'other' | undefined }>>({ type: undefined, name: '', details: '' })

  // Add state to track the source of the current preview image
  const [imageSource, setImageSource] = useState<'upload' | 'webcam' | null>(null);

  // Effect to handle webcam stream connection
  useEffect(() => {
    if (isWebcamActive && webcamStream && videoRef.current) {
      videoRef.current.srcObject = webcamStream
    }
    // Cleanup: Stop stream when component unmounts or webcam is deactivated
    return () => {
      if (webcamStream) {
        webcamStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [isWebcamActive, webcamStream])

  const resetState = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setAnalysisResult(null)
    setAnalysisError(null)
    setSaveError(null)
    setIsAnalyzing(false)
    setIsSaving(false)
    setFormData({ type: undefined, name: '', details: '' })
    // Reset file input value
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    // Stop webcam if active
    if (webcamStream) {
      webcamStream.getTracks().forEach(track => track.stop());
      setWebcamStream(null);
    }
    setIsWebcamActive(false); // Ensure webcam is marked inactive
    setImageSource(null); // Reset image source
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Stop webcam if user chooses to upload a file instead
    if (webcamStream) {
      webcamStream.getTracks().forEach(track => track.stop());
      setWebcamStream(null);
      setIsWebcamActive(false);
    }

    const file = event.target.files?.[0]
    if (file) {
      resetState() // Reset everything when a new file is chosen
      setSelectedFile(file)
      setImageSource('upload'); // Set source to upload
      setFormData({ type: undefined, name: '', details: '' }) // Clear form too
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
      // Automatically trigger analysis after file selection
      handleAnalyzeImage(file)
    } else {
      setSelectedFile(null)
      setPreviewUrl(null)
    }
  }

  const handleAnalyzeImage = async (file: File) => {
    if (!file) return

    setIsAnalyzing(true)
    setAnalysisError(null)
    setAnalysisResult(null)

    const imageFormData = new FormData()
    imageFormData.append('image', file)

    try {
      const result = await analyzeImageAction(imageFormData)
      if (result.success) {
        setAnalysisResult(result.data)
        // Update form state with analysis results
        setFormData({ 
          type: result.data.type,
          name: result.data.name,
          details: result.data.details ?? '', 
        })
      } else {
        setAnalysisError(result.error)
      }
    } catch (err) {
      logger.error("Client-side error calling analyzeImageAction", { error: err })
      setAnalysisError("An unexpected error occurred during analysis.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, type: value as 'food' | 'treatment' | 'other' }));
  }

  const handleSave = async () => {
    // Use the component's formData state for validation and appending
    if (!formData.type || !formData.name) {
      setSaveError("Type and Name are required.")
      return
    }
    if (!userId) {
      logger.error('handleSave called with no userId')
      // Handle missing user ID (e.g., redirect to login)
      return
    }

    setIsSaving(true)
    setSaveError(null)

    // Create a *new* FormData object for the request
    const requestFormData = new FormData()
    requestFormData.append('userId', userId)
    // Append values from the component's formData state
    requestFormData.append('type', formData.type)
    requestFormData.append('name', formData.name)
    if (formData.details) requestFormData.append('details', formData.details)
    if (selectedFile) {
      requestFormData.append('image', selectedFile)
    } else {
      // Handle case where image is missing after analysis (shouldn't normally happen)
      logger.error('Image file missing during handleSave')
      setSaveError('Image file is missing. Please try again.')
      setIsSaving(false)
      return
    }

    try {
      // Pass the correctly constructed FormData to the action
      const response = await saveItemFromImageAction(requestFormData)
      
      if (response.success) {
        logger.info('Item saved successfully', { data: response.data })
        toast({ title: "Item Saved", description: "Your item has been added." })
        
        // Call onSaveSuccess with the original item data BEFORE resetting state
        onSaveSuccess?.({ 
          type: formData.type, 
          name: formData.name, 
          details: formData.details 
        })
        
        // Resetting component state:
        resetState()
      } else {
        logger.error('Failed to save item', { error: response.error })
        setSaveError(response.error)
        toast({ title: "Save Failed", description: response.error, variant: "destructive" })
      }
    } catch (err) {
      logger.error('Error calling saveItemFromImageAction', { error: err })
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.'
      setSaveError(`An unexpected error occurred: ${message}`)
      toast({ title: "Error", description: `An unexpected error occurred: ${message}`, variant: "destructive" })
    } finally {
      setIsSaving(false);
    }
  }

  // Function to handle retaking a photo from webcam
  const handleRetake = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    setAnalysisResult(null); // Clear previous analysis
    setAnalysisError(null);
    setFormData({ type: undefined, name: '', details: '' }); // Clear form data
    // Restart the webcam by calling requestWebcam directly
    requestWebcam(); 
  }

  // Specific function to request webcam (extracted from toggleWebcam)
  const requestWebcam = async () => {
     try {
        resetState(); // Ensure clean state before requesting
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setWebcamStream(stream);
        setIsWebcamActive(true);
      } catch (err) {
        logger.error("Error accessing webcam", { error: err });
        let message = "Could not access webcam.";
        if (err instanceof Error) {
          if (err.name === "NotAllowedError") {
            message = "Webcam permission denied. Please allow access in your browser settings.";
          } else if (err.name === "NotFoundError") {
            message = "No webcam found. Please ensure a webcam is connected and enabled.";
          } else {
            message = `Error: ${err.message}`;
          }
        }
        toast({ 
          title: "Webcam Error", 
          description: message, 
          variant: "destructive",
          duration: 5000
        });
        setIsWebcamActive(false);
      }
  };
  
  // Updated toggleWebcam to use requestWebcam
   const toggleWebcam = async () => {
    if (isWebcamActive) {
      // Stop existing stream and reset state
      resetState(); 
    } else {
      // Request webcam access
      await requestWebcam();
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Match canvas size to video display size
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        // Flip the canvas context horizontally to match the video feed
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
        
        // Draw the current video frame onto the flipped canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Reset the transform so the data URL isn't flipped
        context.setTransform(1, 0, 0, 1, 0, 0);

        // Get the image data URL (e.g., JPEG)
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9); // Quality 0.9
        
        // Stop the webcam stream
        webcamStream?.getTracks().forEach(track => track.stop());
        setWebcamStream(null);
        setIsWebcamActive(false);
        
        // Set the preview
        setPreviewUrl(imageDataUrl);
        
        // Convert data URL to File and set it
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `webcam-capture-${timestamp}.jpg`;
        const capturedFile = dataURLtoFile(imageDataUrl, filename);
        
        if (capturedFile) {
            setSelectedFile(capturedFile);
            // Automatically trigger analysis
            handleAnalyzeImage(capturedFile);
        } else {
            toast({ title: "Capture Error", description: "Failed to process captured image.", variant: "destructive" });
            resetState(); // Reset if file conversion fails
        }
        setImageSource('webcam'); // Set source to webcam
      } else {
          toast({ title: "Capture Error", description: "Could not get canvas context.", variant: "destructive" });
          resetState();
      }
    } else {
        toast({ title: "Capture Error", description: "Webcam components not ready.", variant: "destructive" });
        resetState();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { 
        setIsOpen(open); 
        if (!open) { 
            resetState(); // Call resetState on close
        } 
    }}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Camera className="mr-2 h-4 w-4" /> Add Item via Image
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]" onInteractOutside={(e) => { 
          // Prevent closing if saving
          if (isSaving) {
            e.preventDefault();
          }
        }}>
        <DialogHeader>
          <DialogTitle>Analyze and Add Item</DialogTitle>
          <DialogDescription>
            Upload or take a picture to identify a food or treatment. Edit the details if needed.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input
            id="image-upload-input"
            type="file"
            accept="image/*"
            capture="environment" // Prioritize back camera on mobile
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden" // Hide the default input
            disabled={isAnalyzing || isSaving} // Disable while busy
          />
          {/* Buttons Container */}
          <div className="flex flex-col sm:flex-row gap-2">
              {/* Upload Button - Only show if webcam is NOT active */}
              {!isWebcamActive && (
                  <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()} // Trigger hidden input
                      disabled={isAnalyzing || isSaving}
                      aria-label="Upload picture"
                      className="flex-1"
                  >
                      <Upload className="mr-2 h-4 w-4" />
                      {selectedFile ? `Change Image (${selectedFile.name.substring(0, 20)}...)` : "Upload Picture"}
                  </Button>
              )}
              {/* Webcam Button - Toggle webcam on/off */}
              <Button
                  variant="outline"
                  onClick={() => toggleWebcam()} // We will define this function next
                  disabled={isAnalyzing || isSaving}
                  aria-label={isWebcamActive ? "Stop Webcam" : "Use Webcam"}
                  className="flex-1"
              >
                  <Camera className="mr-2 h-4 w-4" />
                  {isWebcamActive ? "Stop Webcam" : "Use Webcam"}
              </Button>
          </div>

          {/* Webcam Video Feed (only visible when active) */}
          {isWebcamActive && (
              <div className="relative mt-4 border rounded-md overflow-hidden"> {/* Container for video */}
                  <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted // Mute to avoid feedback loop if mic is captured
                      className="w-full h-auto" // Let video determine aspect ratio
                      style={{ transform: 'scaleX(-1)' }} // Mirror image for natural feel
                  />
                   {/* Capture Button (overlay or below video) - Shown when webcam is active & no preview */}
                  {!previewUrl && (
                      <Button
                          onClick={() => captureImage()} // We will define this function next
                          className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-10"
                          aria-label="Capture image"
                      >
                          Capture
                      </Button>
                  )}
              </div>
          )}

          {/* Hidden Canvas for capturing */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {/* Preview Area with Retake Option */}
          {previewUrl && (
            <div className="relative flex flex-col items-center my-2"> {/* Use flex-col */}
              <div className="relative w-full h-40"> {/* Container for Image */}
                  <Image 
                    src={previewUrl} 
                    alt="Selected preview" 
                    fill
                    className="rounded-md border object-contain" 
                    sizes="(max-width: 640px) 100vw, 480px"
                  />
              </div>
              {/* Show Retake button only if the source was the webcam */}
              {imageSource === 'webcam' && (
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={handleRetake}
                  className="mt-2" // Add margin top
                  disabled={isAnalyzing || isSaving}
                >
                    Retake Photo
                </Button>
              )}
            </div>
          )}

          {isAnalyzing && (
            <div className="flex items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing image...
            </div>
          )}

          {analysisError && (
            <div className="text-red-600 text-sm flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>Analysis Error: {analysisError}</span>
            </div>
          )}

          {/* Display editable fields only after analysis OR if manually entered */} 
          {(analysisResult || selectedFile) && !isAnalyzing && (
            <div className="grid gap-3 border-t pt-4 mt-4">
               <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">Type</Label>
                  <Select 
                    name="type"
                    value={formData.type}
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
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Name</Label>
                    <Input 
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleFormChange}
                        className="col-span-3"
                        disabled={isSaving}
                        placeholder="e.g., Apple, Ibuprofen 200mg"
                    />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="details" className="text-right">Details</Label>
                    <Textarea 
                        id="details"
                        name="details"
                        value={formData.details}
                        onChange={handleFormChange}
                        className="col-span-3"
                        disabled={isSaving}
                        placeholder="(Optional) e.g., Brand, dosage, serving size"
                        rows={2} // Smaller text area
                    />
                </div>
             </div>
          )}

          {saveError && (
            <div className="text-red-600 text-sm flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-md mt-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>Save Error: {saveError}</span>
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isSaving}>Cancel</Button>
          </DialogClose>
          <Button 
            type="button" 
            onClick={handleSave} 
            disabled={isAnalyzing || isSaving || !formData.type || !formData.name || !selectedFile} // Also disable if no file selected
           >
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Item
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 
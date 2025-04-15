'use client'

import React, { useState, useRef } from 'react'
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

  // Form state for editing analysis results
  const [formData, setFormData] = useState<Partial<AnalyzedImageResult & { type: 'food' | 'treatment' | 'other' | undefined }>>({ type: undefined, name: '', details: '' })

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
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      resetState() // Reset everything when a new file is chosen
      setSelectedFile(file)
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetState(); }}>
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
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()} // Trigger hidden input
            disabled={isAnalyzing || isSaving}
            aria-label="Upload or take picture"
          >
            <Upload className="mr-2 h-4 w-4" />
            {selectedFile ? `Change Image (${selectedFile.name.substring(0, 20)}...)` : "Upload or Take Picture"}
          </Button>

          {previewUrl && (
            <div className="relative flex justify-center my-2 h-40">
                <Image 
                  src={previewUrl} 
                  alt="Selected preview" 
                  fill
                  className="rounded-md border object-contain" 
                  sizes="(max-width: 640px) 100vw, 480px"
                />
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
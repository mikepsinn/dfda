'use client'

import { useState, useRef, useCallback } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { recordUploadMetadata } from '@/lib/actions/file-upload-actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { UploadCloud, File as FileIcon, X } from 'lucide-react'
import { logger } from '@/lib/logger'
import { useToast } from '@/components/ui/use-toast'

interface FileUploadComponentProps {
  userId: string // Must be passed from a server component or context
  bucketName?: string
  onUploadComplete: (uploadedFileId: string) => void
  // Add props for constraints like allowed types, max size etc. if needed
}

// Basic implementation - needs refinement for multiple files, progress, error details
export function FileUploadComponent({ 
  userId,
  bucketName = 'user_uploads', // Default bucket name
  onUploadComplete 
}: FileUploadComponentProps) {
  const supabase = createBrowserClient()
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError(null) // Clear previous errors
    }
  }

  const handleUpload = useCallback(async () => {
    if (!file || !userId) {
      setError('No file selected or user ID missing.')
      return
    }

    setIsUploading(true)
    setError(null)
    setUploadProgress(0)

    const filePath = `${userId}/${Date.now()}_${file.name}` // Use timestamp to avoid overwrites

    try {
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600', // Optional: cache control
          upsert: false, // Set to true if you want to allow overwriting
          // Note: Progress tracking via Supabase client upload is complex with fetch streams.
          // Simple percentage is not directly available. We simulate progress for UI.
        })

      // Simulate progress for now
      setUploadProgress(50) 

      if (uploadError) {
        throw uploadError
      }

      // Simulate completion
      setUploadProgress(100)

      // Record metadata in DB via Server Action
      const uploadedFileId = await recordUploadMetadata({
        storage_path: filePath,
        file_name: file.name,
        mime_type: file.type,
        size_bytes: file.size,
      })

      if (!uploadedFileId) {
        throw new Error('Failed to record upload metadata in database.')
        // Consider attempting to delete the file from storage here if DB record fails
      }

      logger.info('File upload successful', { userId, filePath, uploadedFileId });
      toast({ title: "Upload Successful", description: `${file.name} uploaded.` })
      onUploadComplete(uploadedFileId) // Notify parent component
      setFile(null) // Reset file input

    } catch (err: any) {
      logger.error('File upload failed', { userId, fileName: file.name, error: err })
      setError(`Upload failed: ${err.message || 'Unknown error'}`)
      toast({ title: "Upload Failed", description: err.message || 'Could not upload file.', variant: "destructive" })
      setUploadProgress(0)
    } finally {
      setIsUploading(false)
    }
  }, [file, userId, supabase.storage, bucketName, onUploadComplete, toast])

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const clearFile = () => {
    setFile(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
    setError(null);
    setUploadProgress(0);
    setIsUploading(false);
  };

  return (
    <div className="space-y-4">
      <div 
        className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer 
                    ${isUploading ? 'border-muted' : 'border-primary/50 hover:border-primary'}`}
        onClick={!isUploading ? triggerFileInput : undefined}
      >
        <Input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
          disabled={isUploading}
        />
        <UploadCloud className={`h-10 w-10 mb-2 ${isUploading ? 'text-muted-foreground' : 'text-primary'}`} />
        <p className="text-sm text-muted-foreground">
          {file ? 'Selected file:' : 'Click or drag file to upload'}
        </p>
        {file && !isUploading && (
            <p className="text-sm font-medium truncate max-w-xs">{file.name}</p>
        )}
         {isUploading && (
            <p className="text-sm font-medium">Uploading {file?.name}...</p>
        )}
      </div>

      {file && !isUploading && (
        <div className="flex items-center justify-between p-2 border rounded-md bg-muted/50">
          <div className="flex items-center gap-2">
             <FileIcon className="h-5 w-5 text-muted-foreground" />
             <span className="text-sm truncate max-w-[200px]">{file.name}</span>
             <span className="text-xs text-muted-foreground">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
          </div>
           <div className="flex items-center gap-2">
             <Button size="sm" onClick={handleUpload} disabled={isUploading}>
               {isUploading ? 'Uploading...' : 'Upload'}
             </Button>
             <Button variant="ghost" size="icon" onClick={clearFile} className="h-8 w-8">
                <X className="h-4 w-4" />
             </Button>
           </div>
        </div>
      )}

      {isUploading && (
        <Progress value={uploadProgress} className="w-full h-2" />
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Upload Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
} 
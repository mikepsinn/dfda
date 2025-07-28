"use client"

import type React from "react"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Paperclip, Camera } from "lucide-react"
import { VoiceRecorder } from "@/components/voice-recorder"
import { uploadFile, uploadImageFromCamera } from "@/lib/file-upload"
import { CameraCapture } from "@/components/camera-capture"

interface ChatInputProps {
  input: string
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleSubmit: (e: React.FormEvent) => void
  isLoading: boolean
  append: (message: { role: "user" | "assistant"; content: string }) => void
}

export function ChatInput({ input, handleInputChange, handleSubmit, isLoading, append }: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isCameraOpen, setIsCameraOpen] = useState(false)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      try {
        setIsUploading(true)
        const file = files[0]

        // Upload the file
        const uploadedFile = await uploadFile(file)

        // Add a message with the file
        append({
          role: "user",
          content: `
            <div>
              <p>I've uploaded a file: ${uploadedFile.name}</p>
              ${
                uploadedFile.type.startsWith("image/")
                  ? `<img src="${uploadedFile.url}" alt="${uploadedFile.name}" class="max-w-full h-auto rounded-md mt-2" style="max-height: 300px;" />`
                  : ""
              }
            </div>
          `,
        })
      } catch (error) {
        console.error("Error uploading file:", error)
      } finally {
        setIsUploading(false)
        // Reset the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      }
    }
  }

  const triggerFileUpload = () => {
    fileInputRef.current?.click()
  }

  const handleCameraCapture = () => {
    setIsCameraOpen(true)
  }

  const handleCapturedImage = async (blob: Blob) => {
    try {
      setIsUploading(true)
      console.log("Processing captured image, size:", blob.size)

      // Upload the captured image
      const uploadedFile = await uploadImageFromCamera(blob)
      console.log("Image uploaded:", uploadedFile)

      // Add a message with the image
      append({
        role: "user",
        content: `
          <div>
            <p>I've captured an image:</p>
            <img src="${uploadedFile.url}" alt="Captured image" class="max-w-full h-auto rounded-md mt-2" style="max-height: 300px;" />
          </div>
        `,
      })
    } catch (error) {
      console.error("Error processing captured image:", error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleVoiceInput = (transcript: string) => {
    if (transcript.trim()) {
      append({
        role: "user",
        content: transcript,
      })
    }
  }

  return (
    <>
      <div className="border-t p-4 dark:border-gray-800">
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*,application/pdf"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={triggerFileUpload}
            disabled={isUploading || isLoading}
            className="dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
          >
            <Paperclip className="h-4 w-4" />
            <span className="sr-only">Upload file</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleCameraCapture}
            disabled={isUploading || isLoading}
            className="dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
          >
            <Camera className="h-4 w-4" />
            <span className="sr-only">Camera</span>
          </Button>
          <VoiceRecorder onTranscript={handleVoiceInput} isDisabled={isUploading || isLoading} />
          <Input
            placeholder={isUploading ? "Uploading..." : "Type your message..."}
            value={input}
            onChange={handleInputChange}
            disabled={isUploading || isLoading}
            className="flex-1 chat-input dark:bg-gray-800 dark:border-gray-700"
          />
          <Button
            type="submit"
            size="icon"
            disabled={isUploading || isLoading}
            className="dark:bg-gray-700 dark:hover:bg-gray-600"
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </div>

      {/* Camera Capture Dialog */}
      <CameraCapture open={isCameraOpen} onClose={() => setIsCameraOpen(false)} onCapture={handleCapturedImage} />
    </>
  )
}

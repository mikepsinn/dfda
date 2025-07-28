"use client"

import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Camera, X } from "lucide-react"

interface CameraCaptureProps {
  open: boolean
  onClose: () => void
  onCapture: (blob: Blob) => void
}

export function CameraCapture({ open, onClose, onCapture }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isCaptured, setIsCaptured] = useState(false)
  const [hasPermission, setHasPermission] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  const [videoAspect, setVideoAspect] = useState({ width: 4, height: 3 })

  // Start camera when dialog opens
  useEffect(() => {
    if (open && !isInitialized) {
      startCamera()
      setIsInitialized(true)
    }

    return () => {
      if (!open) {
        stopCamera()
        setIsInitialized(false)
      }
    }
  }, [open, isInitialized])

  // Handle video metadata loaded to get correct aspect ratio
  const handleVideoMetadata = () => {
    if (videoRef.current) {
      const { videoWidth, videoHeight } = videoRef.current
      if (videoWidth && videoHeight) {
        setVideoAspect({ width: videoWidth, height: videoHeight })
      }
    }
  }

  const startCamera = async () => {
    try {
      setHasPermission(true)

      // Try to get the best video constraints for the device
      const constraints = {
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      setStream(mediaStream)

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        // Ensure video is playing
        videoRef.current.play().catch((err) => {
          console.error("Error playing video:", err)
        })
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
      setHasPermission(false)
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
    setIsCaptured(false)
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      console.error("Video or canvas ref not available")
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current

    // Ensure video is ready
    if (video.readyState !== 4) {
      console.log("Video not ready yet, waiting...")
      setTimeout(capturePhoto, 100)
      return
    }

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480

    // Draw the current video frame on the canvas
    const context = canvas.getContext("2d")
    if (context) {
      try {
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        setIsCaptured(true)
      } catch (err) {
        console.error("Error capturing photo:", err)
      }
    } else {
      console.error("Could not get canvas context")
    }
  }

  const retakePhoto = () => {
    setIsCaptured(false)
  }

  const confirmCapture = () => {
    if (canvasRef.current) {
      canvasRef.current.toBlob(
        (blob) => {
          if (blob) {
            onCapture(blob)
            onClose()
          } else {
            console.error("Failed to create blob from canvas")
          }
        },
        "image/jpeg",
        0.95,
      )
    }
  }

  const handleDialogClose = () => {
    stopCamera()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-md w-[95vw] max-h-[90vh] overflow-hidden dark:bg-gray-900 dark:border-gray-800">
        <DialogHeader>
          <DialogTitle>Take a Photo</DialogTitle>
        </DialogHeader>

        {!hasPermission ? (
          <div className="p-4 text-center">
            <p className="text-red-500 mb-2">Camera access denied</p>
            <p>Please allow camera access in your browser settings to use this feature.</p>
          </div>
        ) : (
          <>
            <div
              className="relative bg-black dark:bg-black rounded-md overflow-hidden w-full"
              style={{
                aspectRatio: `${videoAspect.width}/${videoAspect.height}`,
                maxHeight: "calc(70vh - 120px)",
              }}
            >
              {!isCaptured ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-contain"
                  onLoadedMetadata={handleVideoMetadata}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-black">
                  <canvas ref={canvasRef} className="max-w-full max-h-full object-contain" />
                </div>
              )}
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between mt-4">
              <Button
                variant="outline"
                onClick={handleDialogClose}
                className="w-full sm:w-auto dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>

              {!isCaptured ? (
                <Button
                  onClick={capturePhoto}
                  type="button"
                  className="w-full sm:w-auto dark:bg-gray-700 dark:hover:bg-gray-600"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Capture
                </Button>
              ) : (
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    onClick={retakePhoto}
                    className="w-full sm:w-auto dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
                  >
                    Retake
                  </Button>
                  <Button onClick={confirmCapture} className="w-full sm:w-auto dark:bg-gray-700 dark:hover:bg-gray-600">
                    Use Photo
                  </Button>
                </div>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

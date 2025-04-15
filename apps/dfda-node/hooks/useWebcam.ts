import { useState, useRef, useCallback, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { toast } from '@/components/ui/use-toast';

// Helper function (can be kept internal or moved to a utils file)
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

export function useWebcam() {
    const [isWebcamActive, setIsWebcamActive] = useState(false);
    const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const requestWebcam = useCallback(async (): Promise<boolean> => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            setWebcamStream(stream);
            setIsWebcamActive(true);
            logger.info("Webcam requested and stream started.");
            return true;
        } catch (err) {
            logger.error("Error accessing webcam", { error: err });
            toast({ title: "Webcam Error", description: "Could not access webcam. Check browser permissions.", variant: "destructive" });
            setIsWebcamActive(false);
            setWebcamStream(null);
            return false;
        }
    }, []);

    const stopWebcam = useCallback(() => {
        if (webcamStream) {
            webcamStream.getTracks().forEach(track => track.stop());
            logger.info("Webcam stream stopped.");
        }
        setWebcamStream(null);
        setIsWebcamActive(false);
    }, [webcamStream]);

    const captureImage = useCallback(async (): Promise<{ file: File; previewUrl: string } | null> => {
        if (!videoRef.current || !canvasRef.current || !isWebcamActive) {
            logger.warn("Attempted to capture image but webcam/refs not ready.", { hasVideoRef: !!videoRef.current, hasCanvasRef: !!canvasRef.current, isWebcamActive });
            toast({ title: "Capture Error", description: "Webcam not ready.", variant: "destructive" });
            stopWebcam(); // Stop if something went wrong
            return null;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');

        if (!context) {
            logger.error("Could not get canvas context for capturing image.");
            toast({ title: "Capture Error", description: "Could not get canvas context.", variant: "destructive" });
            stopWebcam();
            return null;
        }

        try {
            // Flip the image horizontally (mirror effect)
            context.translate(canvas.width, 0);
            context.scale(-1, 1);
            // Draw the video frame onto the canvas
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            // Reset transformation
            context.setTransform(1, 0, 0, 1, 0, 0);

            const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
            logger.info("Image captured from webcam.");

            // Stop the webcam stream *after* successfully capturing
            stopWebcam();

            // Generate a filename (consider passing imageType if needed for filename)
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `webcam-capture-${timestamp}.jpg`;
            const capturedFile = dataURLtoFile(imageDataUrl, filename);

            if (capturedFile) {
                return { file: capturedFile, previewUrl: imageDataUrl };
            } else {
                toast({ title: "Capture Error", description: "Failed to process captured image.", variant: "destructive" });
                return null;
            }
        } catch (error) {
             logger.error("Error during canvas image capture", { error });
             toast({ title: "Capture Error", description: "An error occurred during image capture.", variant: "destructive" });
             stopWebcam();
             return null;
        }

    }, [isWebcamActive, stopWebcam]); // Dependency on isWebcamActive and stopWebcam

     // Effect to stop stream on unmount (optional, but good practice)
     useEffect(() => {
        return () => {
            if (webcamStream) {
                webcamStream.getTracks().forEach(track => track.stop());
                logger.info("Webcam stream stopped on hook unmount.");
            }
        };
    }, [webcamStream]);


    return {
        videoRef,
        canvasRef,
        isWebcamActive,
        webcamStream, // Return stream so the main component can attach it
        requestWebcam,
        stopWebcam,
        captureImage,
    };
}

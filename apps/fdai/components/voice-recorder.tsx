"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Mic, StopCircle } from "lucide-react"

interface VoiceRecorderProps {
  onTranscript: (transcript: string) => void
  isDisabled: boolean
}

export function VoiceRecorder({ onTranscript, isDisabled }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState("")
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recognitionRef = useRef<any>(null)
  const audioChunksRef = useRef<Blob[]>([])

  // Initialize speech recognition
  useEffect(() => {
    // Check if browser supports SpeechRecognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = "en-US"

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = ""
        let finalTranscript = ""

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }

        // Update the transcript state
        setTranscript(finalTranscript || interimTranscript)
      }

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error)
        stopRecording()
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  const startRecording = async () => {
    try {
      setTranscript("")
      setIsRecording(true)
      audioChunksRef.current = []

      // Start speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.start()
      }

      // Also record audio for potential future use
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.start()
    } catch (error) {
      console.error("Error starting recording:", error)
      setIsRecording(false)
    }
  }

  const stopRecording = () => {
    // Stop speech recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }

    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()

      // Stop all audio tracks
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop())
    }

    setIsRecording(false)

    // Submit the transcript if it's not empty
    if (transcript.trim()) {
      onTranscript(transcript)
      setTranscript("")
    }
  }

  return (
    <div className="flex items-center gap-2">
      {isRecording ? (
        <>
          <Button type="button" variant="destructive" size="icon" onClick={stopRecording} className="animate-pulse">
            <StopCircle className="h-4 w-4" />
            <span className="sr-only">Stop recording</span>
          </Button>
          {transcript && <div className="text-sm text-muted-foreground max-w-[150px] truncate">{transcript}</div>}
        </>
      ) : (
        <Button type="button" variant="outline" size="icon" onClick={startRecording} disabled={isDisabled}>
          <Mic className="h-4 w-4" />
          <span className="sr-only">Start voice input</span>
        </Button>
      )}
    </div>
  )
}

"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Volume2, VolumeX } from "lucide-react"

interface TextToSpeechProps {
  text: string
  autoPlay?: boolean
}

export function TextToSpeech({ text, autoPlay = false }: TextToSpeechProps) {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null)
  const isMounted = useRef(true)

  // Initialize voices when component mounts
  useEffect(() => {
    const loadVoices = () => {
      // Only update state if component is still mounted
      if (!isMounted.current) return

      const availableVoices = window.speechSynthesis.getVoices()
      if (availableVoices.length > 0) {
        setVoices(availableVoices)

        // Try to find a female English voice for better health assistant experience
        const femaleEnglishVoice = availableVoices.find(
          (voice) => voice.lang.includes("en") && voice.name.includes("Female"),
        )

        // Or any English voice
        const englishVoice = availableVoices.find((voice) => voice.lang.includes("en"))

        setSelectedVoice(femaleEnglishVoice || englishVoice || availableVoices[0])
      }
    }

    loadVoices()

    // Chrome loads voices asynchronously
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices
    }

    return () => {
      isMounted.current = false
      window.speechSynthesis.cancel()
    }
  }, [])

  // Auto-play effect with debounce
  useEffect(() => {
    if (!autoPlay || !text || !selectedVoice || isSpeaking) return

    // Add a small delay to prevent rapid state changes
    const timeoutId = setTimeout(() => {
      if (isMounted.current) {
        speak()
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [autoPlay, text, selectedVoice, isSpeaking])

  // Clean up any ongoing speech when component unmounts
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel()
    }
  }, [])

  const speak = () => {
    if (!text || !selectedVoice || !isMounted.current) return

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.voice = selectedVoice
    utterance.rate = 1.0
    utterance.pitch = 1.0
    utterance.volume = 1.0

    utterance.onstart = () => {
      if (isMounted.current) setIsSpeaking(true)
    }
    utterance.onend = () => {
      if (isMounted.current) setIsSpeaking(false)
    }
    utterance.onerror = () => {
      if (isMounted.current) setIsSpeaking(false)
    }

    window.speechSynthesis.speak(utterance)
  }

  const stop = () => {
    window.speechSynthesis.cancel()
    if (isMounted.current) setIsSpeaking(false)
  }

  // Extract plain text from HTML content
  const getPlainText = (html: string) => {
    const tempDiv = document.createElement("div")
    tempDiv.innerHTML = html
    return tempDiv.textContent || tempDiv.innerText || ""
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={isSpeaking ? stop : speak}
      className="absolute top-2 right-2"
      title={isSpeaking ? "Stop speaking" : "Read aloud"}
    >
      {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      <span className="sr-only">{isSpeaking ? "Stop speaking" : "Read aloud"}</span>
    </Button>
  )
}

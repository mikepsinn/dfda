'use client'

import { useEffect, useRef, useState } from 'react'
import { WaveformMouth } from './WaveformMouth'

export function FdaiTalkingFace() {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [audioData, setAudioData] = useState<number[]>([])
  const synth = useRef<SpeechSynthesis | null>(null)
  
  useEffect(() => {
    synth.current = window.speechSynthesis
  }, [])

  const speak = (text: string) => {
    if (!synth.current) return

    const utterance = new SpeechSynthesisUtterance(text)
    
    utterance.onstart = () => {
      setIsSpeaking(true)
      // Generate mock audio data for visualization
      const mockAudioInterval = setInterval(() => {
        setAudioData(generateMockAudioData())
      }, 50)

      utterance.onend = () => {
        setIsSpeaking(false)
        clearInterval(mockAudioInterval)
        setAudioData([])
      }
    }

    synth.current.speak(utterance)
  }

  const generateMockAudioData = () => {
    // Generate random waveform data that resembles a mouth shape
    const length = 32
    const data = []
    for (let i = 0; i < length; i++) {
      const value = Math.sin(i * 0.2) * Math.random() * 0.5 + 0.5
      data.push(value)
    }
    return data
  }

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="w-64 h-64 bg-gray-100 rounded-full flex items-center justify-center">
        <WaveformMouth 
          audioData={audioData}
          isSpeaking={isSpeaking}
        />
      </div>
      
      <button
        onClick={() => speak("Hello! I am your FDAI assistant. How can I help you today?")}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
      >
        Make Me Speak
      </button>
    </div>
  )
} 
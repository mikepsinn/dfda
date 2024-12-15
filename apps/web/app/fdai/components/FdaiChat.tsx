'use client'

import { useChat } from 'ai/react'
import { useState, useRef, useEffect } from 'react'
import { text2measurements } from '@/lib/text2measurements'
import Image from 'next/image'
import { chatAction } from '../actions'

export function FdaiChat() {
  const [isRecording, setIsRecording] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const synth = useRef<SpeechSynthesis | null>(null)
  
  useEffect(() => {
    synth.current = window.speechSynthesis
  }, [])

  const { messages, input, handleInputChange, handleSubmit, setInput } = useChat({
    api: chatAction,
    onFinish: async (message) => {
      // Speak the response if we're in voice mode
      if (isRecording) {
        speak(message.content)
      }
      
      // Process measurements from the response
      const currentUtcDateTime = new Date().toISOString()
      const timeZoneOffset = new Date().getTimezoneOffset()
      await text2measurements(message.content, currentUtcDateTime, timeZoneOffset)
    }
  })

  const speak = (text: string) => {
    if (!synth.current) return

    const utterance = new SpeechSynthesisUtterance(text)
    
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)

    synth.current.speak(utterance)
  }

  // Speech recognition setup
  const startRecording = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false

      recognition.onstart = () => setIsRecording(true)
      recognition.onend = () => setIsRecording(false)
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setInput(transcript)
        handleSubmit(new Event('submit') as any)
      }

      recognition.start()
    } else {
      alert('Speech recognition is not supported in this browser')
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setSelectedImage(reader.result as string)
        // Submit the image with the next message
        handleSubmit(new Event('submit') as any, {
          data: { imageUrl: reader.result }
        })
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="w-full max-w-2xl flex flex-col space-y-4">
      <div className="flex-grow overflow-y-auto p-4 space-y-4 min-h-[400px] bg-gray-50 rounded-lg">
        {messages.map(m => (
          <div 
            key={m.id} 
            className={`p-3 rounded-lg ${
              m.role === 'user' ? 'bg-blue-100 ml-auto' : 'bg-white'
            } max-w-[80%]`}
          >
            <p className="whitespace-pre-wrap">{m.content}</p>
          </div>
        ))}
      </div>

      {selectedImage && (
        <div className="relative w-32 h-32">
          <Image 
            src={selectedImage}
            alt="Uploaded image"
            fill
            className="object-cover rounded"
          />
          <button 
            onClick={() => setSelectedImage(null)}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6"
          >
            ×
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex space-x-2">
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          placeholder="Ask about your health, diet, or treatments..."
          className="flex-grow p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          title="Upload image"
        >
          📷
        </button>
        
        <button
          type="button"
          onClick={startRecording}
          className={`p-2 ${
            isRecording ? 'bg-red-500' : 'bg-blue-500'
          } text-white rounded-lg hover:opacity-90`}
          title={isRecording ? 'Recording...' : 'Start voice input'}
        >
          🎤
        </button>
        
        <button
          type="submit"
          className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Send
        </button>
      </form>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />
    </div>
  )
} 
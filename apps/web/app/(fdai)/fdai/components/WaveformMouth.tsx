'use client'

import { useEffect, useRef } from 'react'

interface WaveformMouthProps {
  audioData: number[]
  isSpeaking: boolean
}

export function WaveformMouth({ audioData, isSpeaking }: WaveformMouthProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (!isSpeaking || audioData.length === 0) {
      // Draw default closed mouth when not speaking
      ctx.beginPath()
      ctx.moveTo(20, canvas.height / 2)
      ctx.lineTo(canvas.width - 20, canvas.height / 2)
      ctx.strokeStyle = '#000'
      ctx.lineWidth = 3
      ctx.stroke()
      return
    }

    // Draw waveform that looks like a mouth
    ctx.beginPath()
    ctx.moveTo(0, canvas.height / 2)

    const sliceWidth = canvas.width / audioData.length

    for (let i = 0; i < audioData.length; i++) {
      const x = i * sliceWidth
      const y = (audioData[i] * canvas.height / 2) + canvas.height / 4

      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }

    // Mirror the waveform to create a mouth shape
    for (let i = audioData.length - 1; i >= 0; i--) {
      const x = i * sliceWidth
      const y = canvas.height - ((audioData[i] * canvas.height / 2) + canvas.height / 4)
      ctx.lineTo(x, y)
    }

    ctx.closePath()
    ctx.fillStyle = '#ff9999' // Light red color for the mouth
    ctx.fill()
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 2
    ctx.stroke()
  }, [audioData, isSpeaking])

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={100}
      className="w-48 h-24"
    />
  )
} 
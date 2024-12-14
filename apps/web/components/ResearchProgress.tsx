'use client'

import { useEffect, useState } from 'react'
import AIStepLoader from '@/components/AIStepLoader'
import { ResearchStep } from '@/lib/agents/researcher/researcher'

const DEFAULT_STEPS = [
  'Initializing research process',
  'Gathering information from reliable sources',
  'Analyzing and synthesizing information',
  'Writing comprehensive analysis',
  'Saving and finalizing report',
  'Research complete'
]

export default function ResearchProgress({ 
  isLoading,
  onComplete
}: { 
  isLoading: boolean
  onComplete?: () => void 
}) {
  const [currentStep, setCurrentStep] = useState<string>('')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!isLoading) return

    const handleProgress = (data: ResearchStep) => {
      setCurrentStep(data.step)
      setProgress(data.progress)
      if (data.progress === 100 && onComplete) {
        onComplete()
      }
    }

    // Setup event listener
    const eventSource = new EventSource('/api/research-progress')
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)
      handleProgress(data)
    }

    return () => {
      eventSource.close()
    }
  }, [isLoading, onComplete])

  if (!isLoading) return null

  return (
    <AIStepLoader 
      steps={DEFAULT_STEPS}
      currentStepIndex={Math.floor(progress / (100 / DEFAULT_STEPS.length))}
    />
  )
} 
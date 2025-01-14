"use client"

import React, { useState, useEffect } from 'react'

interface MetaAnalysisProgressProps {
  isLoading: boolean
  treatmentName?: string
  conditionName?: string
  onComplete?: () => void
}

const ANALYSIS_TASKS = [
  'Gathering Clinical Studies',
  'Analyzing Research Data',
  'Evaluating Safety Profiles',
  'Synthesizing Effectiveness Data',
  'Compiling Treatment Outcomes',
  'Generating Recommendations'
]

export default function MetaAnalysisProgress({ 
  isLoading, 
  treatmentName, 
  conditionName,
  onComplete 
}: MetaAnalysisProgressProps) {
  const [taskProgress, setTaskProgress] = useState(0)
  const [currentTask, setCurrentTask] = useState(0)
  const [activeResearchers, setActiveResearchers] = useState(0)

  useEffect(() => {
    if (!isLoading) {
      if (onComplete) {
        onComplete()
      }
      return
    }

    const progressInterval = setInterval(() => {
      setTaskProgress(prev => {
        if (prev >= 100) {
          // Move to next task
          setCurrentTask(current => {
            if (current >= ANALYSIS_TASKS.length - 1) {
              clearInterval(progressInterval)
              return current
            }
            return current + 1
          })
          return 0
        }
        return prev + 1
      })
    }, 50)

    const researcherInterval = setInterval(() => {
      setActiveResearchers(prev => Math.floor(Math.random() * 100 + 400))
    }, 2000)

    return () => {
      clearInterval(progressInterval)
      clearInterval(researcherInterval)
    }
  }, [isLoading, onComplete])

  if (!isLoading) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/90">
      <div className="w-full max-w-4xl p-8 bg-black border-4 border-cyan-500 rounded-lg text-cyan-300">
        <h2 className="text-3xl font-bold text-cyan-400 mb-6 animate-pulse">
          Meta-Analysis in Progress
        </h2>

        <div className="mb-8">
          <p className="text-lg text-purple-400 mb-2">Analyzing:</p>
          <p className="text-2xl font-bold text-white animate-neon">
            {treatmentName && conditionName ? `${treatmentName} for ${conditionName}` :
             treatmentName ? `Generating meta-analysis of the effectiveness of ${treatmentName} for various conditions` :
             conditionName ? `Generating meta-analysis of the best treatments for ${conditionName}` :
             'Generating Meta-Analysis'}
          </p>
        </div>

        <div className="mb-6 relative">
          <p className="text-sm text-cyan-400 mb-2">
            {ANALYSIS_TASKS[currentTask]}
          </p>
          <div className="w-full h-4 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-600 via-cyan-400 to-purple-600 animate-gradient"
              style={{ width: `${taskProgress}%` }}
             />
          </div>
          <p className="absolute top-full left-0 text-xs text-cyan-400 mt-1">
            Progress: {taskProgress}%
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-800 p-4 rounded-lg border border-purple-500">
            <p className="text-purple-400 text-sm mb-2">Active Researchers</p>
            <p className="text-2xl font-bold text-white">
              {activeResearchers.toLocaleString()}
            </p>
            <p className="text-xs text-purple-300 mt-1">
              Analyzing clinical data
            </p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg border border-cyan-500">
            <p className="text-cyan-400 text-sm mb-2">Overall Progress</p>
            <p className="text-2xl font-bold text-white">
              {Math.floor((currentTask / ANALYSIS_TASKS.length) * 100)}%
            </p>
            <p className="text-xs text-cyan-300 mt-1">
              {ANALYSIS_TASKS.length - currentTask} tasks remaining
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-cyan-400 mb-1">Analysis Pipeline:</p>
          {ANALYSIS_TASKS.map((task, index) => (
            <div key={task} className="w-full">
              <p className="text-xs text-purple-300 mb-1">
                {index + 1}. {task}
              </p>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-cyan-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      index < currentTask
                        ? 100
                        : index === currentTask
                        ? taskProgress
                        : 0
                    }%`,
                  }}
                 />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 
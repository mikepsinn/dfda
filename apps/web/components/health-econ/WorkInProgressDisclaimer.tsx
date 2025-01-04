"use client"

import React, { useEffect, useState } from "react"
import { AlertTriangle, ChevronDown, ChevronUp, X } from "lucide-react"


export function WorkInProgressDisclaimer() {
  const [isVisible, setIsVisible] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    const isDismissed = localStorage.getItem("health-econ-wip-dismissed")
    if (isDismissed === "true") {
      setIsVisible(false)
    }
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    //localStorage.setItem("health-econ-wip-dismissed", "true")
  }

  return (
    <>
      <div className="relative mb-6 rounded-xl border-4 border-black bg-orange-400 p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-black" strokeWidth={3} />
          <p className="flex-1 font-bold text-black">
            Work in Progress: This health economics model is under active development
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-black bg-white px-3 py-1 text-sm font-medium shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              Learn More
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={handleDismiss}
              className="rounded-lg border-2 border-black bg-white p-1.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              aria-label="Dismiss banner"
            >
              <X className="h-4 w-4" strokeWidth={3} />
            </button>
          </div>
        </div>
        {isExpanded && (
          <div className="mt-4 space-y-2 border-t-2 border-black pt-4">
            <p>
              This health economics simulation is currently being refined and validated. The calculations and assumptions are based on peer-reviewed research, but the model is still evolving.
            </p>
            <p>
              While we strive for accuracy, the results should be considered preliminary and used for exploratory purposes only. We welcome feedback and contributions to improve the model.
            </p>
            <p>
              Please review the methodology notes and limitations sections below for detailed information about the current state of the model.
            </p>
          </div>
        )}
      </div>
    </>
  )
} 
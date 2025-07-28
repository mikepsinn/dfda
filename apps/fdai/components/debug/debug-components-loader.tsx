"use client"

import { useEffect, useState } from "react"
import { OpenAILogViewer } from "./openai-log-viewer"
import { ApiTester } from "./api-tester"

// This component ensures debug components are loaded in the DOM
// but hidden until triggered via global functions
export function DebugComponentsLoader() {
  const [showOpenAILogs, setShowOpenAILogs] = useState(false)
  const [showApiTester, setShowApiTester] = useState(false)

  useEffect(() => {
    // Create global functions to show debug components
    window.openOpenAILogs = () => setShowOpenAILogs(true)
    window.openApiTester = () => setShowApiTester(true)

    return () => {
      // Clean up global functions
      delete window.openOpenAILogs
      delete window.openApiTester
    }
  }, [])

  // Only render in development mode
  if (process.env.NODE_ENV !== "development") {
    return null
  }

  return (
    <>
      {showOpenAILogs && <OpenAILogViewer onClose={() => setShowOpenAILogs(false)} />}
      {showApiTester && <ApiTester onClose={() => setShowApiTester(false)} />}
    </>
  )
}

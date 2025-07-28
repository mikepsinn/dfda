"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { X, RefreshCw, Download } from "lucide-react"

type LogEntry = {
  timestamp: string
  level: string
  message: string
  context?: string
  data?: any
  error?: any
}

export function OpenAILogViewer() {
  const [isOpen, setIsOpen] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("requests")

  // Create a global function to open the logs viewer
  useEffect(() => {
    // Define the global function to open the logs viewer
    window.openOpenAILogs = () => {
      setIsOpen(true)
      fetchLogs() // Automatically fetch logs when opened
    }

    // Clean up
    return () => {
      // @ts-ignore - Remove the global function
      window.openOpenAILogs = undefined
    }
  }, [])

  // Fetch logs from the server
  const fetchLogs = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/debug/openai-logs")
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs || [])
      }
    } catch (error) {
      console.error("Error fetching OpenAI logs:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Download logs as JSON
  const downloadLogs = () => {
    const dataStr = JSON.stringify(logs, null, 2)
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`

    const link = document.createElement("a")
    link.setAttribute("href", dataUri)
    link.setAttribute("download", `openai-logs-${new Date().toISOString()}.json`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Filter logs based on active tab
  const filteredLogs = logs.filter((log) => {
    if (activeTab === "requests") {
      return log.message.includes("Request to OpenAI") || log.message.includes("Request to AI provider")
    } else if (activeTab === "responses") {
      return log.message.includes("Response received")
    } else if (activeTab === "errors") {
      return (
        log.level === "error" &&
        (log.message.includes("OpenAI") || log.context === "OpenAI" || log.message.includes("AI provider"))
      )
    }
    return true
  })

  // Only show in development mode
  if (process.env.NODE_ENV !== "development") {
    return null
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-xl">AI Provider Logs</CardTitle>
            <CardDescription>Debug AI provider requests and responses</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <div className="px-6 pb-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="requests">Requests</TabsTrigger>
              <TabsTrigger value="responses">Responses</TabsTrigger>
              <TabsTrigger value="errors">Errors</TabsTrigger>
              <TabsTrigger value="all">All Logs</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <CardContent className="flex-1 overflow-auto p-6 pt-2">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No logs found. Try making an AI request first.</div>
          ) : (
            <div className="space-y-4">
              {filteredLogs.map((log, index) => (
                <div key={index} className="border rounded-md p-3 text-sm">
                  <div className="flex justify-between items-start mb-2">
                    <span
                      className={`font-mono px-1.5 py-0.5 rounded text-xs ${
                        log.level === "error"
                          ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          : log.level === "warn"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                            : log.level === "info"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                      }`}
                    >
                      {log.level.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{log.timestamp}</span>
                  </div>
                  <p className="font-medium mb-1">{log.message}</p>
                  {log.context && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Context: {log.context}</p>
                  )}
                  {log.data && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs font-medium text-gray-500 dark:text-gray-400">
                        Data
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-md overflow-auto text-xs max-h-40">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    </details>
                  )}
                  {log.error && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs font-medium text-red-500 dark:text-red-400">
                        Error Details
                      </summary>
                      <pre className="mt-2 p-2 bg-red-50 dark:bg-red-900/30 rounded-md overflow-auto text-xs max-h-40">
                        {JSON.stringify(log.error, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t px-6 py-4 flex justify-between">
          <Button variant="outline" onClick={downloadLogs} disabled={logs.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Download Logs
          </Button>
          <Button onClick={fetchLogs} disabled={isLoading}>
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Logs
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

// Add a global type declaration
declare global {
  interface Window {
    openOpenAILogs: () => void
  }
}

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Bug, Check, Copy, RefreshCw } from "lucide-react"

export function ApiTester() {
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState<any>(null)
  const [streamContent, setStreamContent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showTester, setShowTester] = useState(false)
  const [requestBody, setRequestBody] = useState(
    JSON.stringify(
      {
        messages: [
          {
            id: "1",
            role: "user",
            content: "Hello, how are you?",
          },
        ],
      },
      null,
      2,
    ),
  )

  useEffect(() => {
    const triggerButton = document.getElementById("api-tester-trigger")
    if (triggerButton) {
      triggerButton.addEventListener("click", () => setShowTester(true))
      return () => {
        triggerButton.removeEventListener("click", () => setShowTester(true))
      }
    }
  }, [])

  const testApi = async () => {
    setIsLoading(true)
    setError(null)
    setResponse(null)
    setStreamContent(null)

    try {
      const parsedBody = JSON.parse(requestBody)

      console.log("Testing Chat API with body:", parsedBody)

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: requestBody,
      })

      // For streaming responses, we need to handle differently
      const contentType = res.headers.get("Content-Type") || ""

      if (contentType.includes("text/event-stream")) {
        setResponse({
          status: res.status,
          statusText: res.statusText,
          headers: Object.fromEntries([...res.headers.entries()]),
          body: "Streaming response detected. See below for stream content.",
        })

        // Log the stream for debugging
        console.log("Streaming response from Chat API:", res)

        // Try to read the stream
        const reader = res.body?.getReader()
        if (reader) {
          let chunks = ""
          try {
            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              const decodedChunk = new TextDecoder().decode(value)
              chunks += decodedChunk
              setStreamContent((prev) => (prev || "") + decodedChunk)
            }
            console.log("Stream content:", chunks)
          } catch (streamError) {
            console.error("Error reading stream:", streamError)
            setError(
              `Error reading stream: ${streamError instanceof Error ? streamError.message : String(streamError)}`,
            )
          }
        }
      } else {
        // For JSON responses
        try {
          const data = await res.json()
          setResponse({
            status: res.status,
            statusText: res.statusText,
            headers: Object.fromEntries([...res.headers.entries()]),
            body: data,
          })
        } catch (jsonError) {
          // If JSON parsing fails, try to get the text
          const text = await res.text()
          setResponse({
            status: res.status,
            statusText: res.statusText,
            headers: Object.fromEntries([...res.headers.entries()]),
            body: { raw_text: text },
          })

          console.error("Error parsing JSON response:", jsonError)
          setError(`Error parsing JSON response: ${text}`)
        }
      }
    } catch (err) {
      console.error("Error testing API:", err)
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoading(false)
    }
  }

  // Only show in development mode
  if (process.env.NODE_ENV !== "development") {
    return null
  }

  if (!showTester) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-auto">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bug className="mr-2 h-5 w-5" />
            Chat API Tester
          </CardTitle>
          <CardDescription>Test the Chat API directly to debug issues</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Request Body (JSON):</label>
            <Textarea
              value={requestBody}
              onChange={(e) => setRequestBody(e.target.value)}
              className="font-mono text-sm h-40"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {response && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Response:</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(response, null, 2))
                  }}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-md p-3 overflow-auto max-h-60">
                <pre className="text-xs">{JSON.stringify(response, null, 2)}</pre>
              </div>
            </div>
          )}

          {streamContent && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Stream Content:</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(streamContent)
                  }}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-md p-3 overflow-auto max-h-60">
                <pre className="text-xs whitespace-pre-wrap">{streamContent}</pre>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => setShowTester(false)}>
            Close
          </Button>
          <Button onClick={testApi} disabled={isLoading}>
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Test API
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

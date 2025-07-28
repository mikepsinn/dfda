import { AlertCircle, AlertTriangle, Info, HelpCircle } from "lucide-react"
import { isDebugMode } from "@/lib/env"

interface ErrorDisplayProps {
  error: any
  title?: string
  showDetails?: boolean
}

export function ErrorDisplay({ error, title = "Error", showDetails = false }: ErrorDisplayProps) {
  const debugMode = isDebugMode()

  // Get error message
  const errorMessage = error?.message || error?.error || "An unexpected error occurred"

  // Get error type
  const errorType = error?.type || error?.details?.type || "unknown"

  // Get error details for debug mode
  const details = debugMode || showDetails ? error?.details : null

  // Determine icon based on error type
  const getIcon = () => {
    switch (errorType) {
      case "authentication":
      case "quota_exceeded":
      case "rate_limit":
        return <AlertCircle className="h-5 w-5 text-amber-500" />
      case "content_filter":
      case "safety":
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      case "network_error":
      case "service_unavailable":
      case "timeout":
        return <Info className="h-5 w-5 text-blue-500" />
      default:
        return <HelpCircle className="h-5 w-5 text-gray-500" />
    }
  }

  // Get helpful suggestion based on error type
  const getHelpMessage = () => {
    switch (errorType) {
      case "authentication":
        return "Please check if your API key is valid and properly configured."
      case "quota_exceeded":
      case "rate_limit":
        return "You have exceeded your usage limit. Please wait a while and try again."
      case "content_filter":
      case "safety":
        return "Your request contained content that was flagged by our safety filters."
      case "network_error":
        return "Please check your internet connection and try again."
      case "service_unavailable":
        return "The AI service is temporarily unavailable. Please try again later."
      case "timeout":
        return "The request took too long to complete. Please try a shorter message."
      case "model_not_found":
        return `The AI model you're trying to use is not available. Please check your configuration.`
      case "context_length":
        return "Your conversation is too long. Please start a new conversation."
      default:
        return "Please try again or contact support if the issue persists."
    }
  }

  return (
    <div className="rounded-md bg-red-50 p-4 my-4 border border-red-200">
      <div className="flex">
        <div className="flex-shrink-0">{getIcon()}</div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">{title}</h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{errorMessage}</p>
            <p className="mt-1 text-xs text-red-600">{getHelpMessage()}</p>

            {(debugMode || showDetails) && details && (
              <div className="mt-3 p-2 bg-red-100 rounded text-xs overflow-x-auto">
                <p className="font-bold">Debug Information:</p>
                <pre className="mt-1 whitespace-pre-wrap">
                  {typeof details === "string" ? details : JSON.stringify(details, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

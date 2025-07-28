import { NextResponse } from "next/server"

// In-memory log storage for development
const openaiLogs: any[] = []

// Maximum number of logs to keep
const MAX_LOGS = 100

// Add a log entry
export function addOpenAILog(level: string, message: string, context?: string, data?: any, error?: any) {
  // Only store logs in development
  if (process.env.NODE_ENV !== "development") return

  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    context,
    data,
    error,
  }

  openaiLogs.unshift(logEntry)

  // Keep only the most recent logs
  if (openaiLogs.length > MAX_LOGS) {
    openaiLogs.pop()
  }
}

export async function GET(request: Request) {
  // Only available in development
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Only available in development mode" }, { status: 403 })
  }

  return NextResponse.json({ logs: openaiLogs })
}

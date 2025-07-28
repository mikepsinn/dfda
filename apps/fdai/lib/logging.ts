type LogLevel = "debug" | "info" | "warn" | "error"

interface LogOptions {
  context?: string
  data?: any
  error?: unknown
}

/**
 * Structured logger with consistent formatting and error handling
 */
export class Logger {
  private static instance: Logger
  private logLevel: LogLevel = "info"

  private constructor() {
    // Set log level based on environment
    if (process.env.NODE_ENV === "development") {
      this.logLevel = (process.env.LOG_LEVEL as LogLevel) || "debug"
    }
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  /**
   * Log a debug message
   */
  public debug(message: string, options?: LogOptions): void {
    if (!this.shouldLog("debug")) return
    this.logWithLevel("debug", message, options)
  }

  /**
   * Log an info message
   */
  public info(message: string, options?: LogOptions): void {
    if (!this.shouldLog("info")) return
    this.logWithLevel("info", message, options)
  }

  /**
   * Log a warning message
   */
  public warn(message: string, options?: LogOptions): void {
    if (!this.shouldLog("warn")) return
    this.logWithLevel("warn", message, options)
  }

  /**
   * Log an error message with detailed error information
   */
  public error(message: string, options?: LogOptions): void {
    if (!this.shouldLog("error")) return
    this.logWithLevel("error", message, options)
  }

  /**
   * Create a child logger with a specific context
   */
  public createChildLogger(context: string): Logger {
    const childLogger = new Logger()
    childLogger.logLevel = this.logLevel

    // Override methods to include context
    childLogger.debug = (message, options = {}) => {
      this.debug(message, { ...options, context })
    }

    childLogger.info = (message, options = {}) => {
      this.info(message, { ...options, context })
    }

    childLogger.warn = (message, options = {}) => {
      this.warn(message, { ...options, context })
    }

    childLogger.error = (message, options = {}) => {
      this.error(message, { ...options, context })
    }

    return childLogger
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ["debug", "info", "warn", "error"]
    const currentLevelIndex = levels.indexOf(this.logLevel)
    const targetLevelIndex = levels.indexOf(level)
    return targetLevelIndex >= currentLevelIndex
  }

  private logWithLevel(level: LogLevel, message: string, options?: LogOptions): void {
    const timestamp = new Date().toISOString()
    const context = options?.context ? `[${options.context}]` : ""
    const logPrefix = `${timestamp} ${level.toUpperCase()} ${context}`

    // Log the message
    console[level](`${logPrefix} ${message}`)

    // Log additional data if provided
    if (options?.data) {
      try {
        console[level](`${logPrefix} Data:`, typeof options.data === "object" ? options.data : { value: options.data })
      } catch (e) {
        console[level](`${logPrefix} Data: [Could not stringify data]`)
      }
    }

    // Log error details if provided
    if (options?.error) {
      this.logErrorDetails(level, logPrefix, options.error)
    }
  }

  // Update the logErrorDetails method to avoid exposing file paths
  private logErrorDetails(level: LogLevel, prefix: string, error: unknown): void {
    if (error instanceof Error) {
      console[level](`${prefix} Error: ${error.message}`)

      // Log error cause if available (Node.js v16.9.0+)
      if ("cause" in error && error.cause) {
        console[level](`${prefix} Caused by:`, error.cause)
      }

      // Log stack trace but sanitize file paths
      if (error.stack) {
        // Remove absolute file paths from stack trace
        const sanitizedStack = error.stack
          .split("\n")
          .map((line) => {
            // Replace file paths with just the file name
            return line.replace(/$$\/.*\/([^/]+)$$/, "($1)").replace(/at \/.*\/([^/]+)/, "at $1")
          })
          .join("\n")

        console[level](`${prefix} Stack trace:\n${sanitizedStack}`)
      }

      // Log additional properties
      const errorObj: Record<string, any> = {}
      Object.getOwnPropertyNames(error).forEach((prop) => {
        if (prop !== "stack" && prop !== "message") {
          errorObj[prop] = (error as any)[prop]
        }
      })

      if (Object.keys(errorObj).length > 0) {
        console[level](`${prefix} Additional error properties:`, errorObj)
      }
    } else {
      // Handle non-Error objects
      console[level](`${prefix} Non-Error object thrown:`, error)
    }
  }
}

// Export a default logger instance
export const logger = Logger.getInstance()

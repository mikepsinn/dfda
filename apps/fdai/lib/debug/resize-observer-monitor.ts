/**
 * Utility to monitor and debug ResizeObserver errors
 * Currently disabled but kept for future debugging if needed
 */

// Flag to enable/disable the monitor (disabled by default)
const ENABLE_MONITOR = false

// Flag to enable/disable detailed logging
const ENABLE_DETAILED_LOGGING = false

// Store original console error to restore it later if needed
const originalConsoleError = console.error

// Track components that might be using ResizeObserver
const resizeObserverUsers = new Set<string>()

/**
 * Initialize the ResizeObserver error monitor
 */
export function initResizeObserverMonitor() {
  if (typeof window === "undefined" || !ENABLE_MONITOR) return

  // Override console.error to catch and log ResizeObserver errors
  console.error = (...args) => {
    const errorMessage = args[0]?.toString() || ""

    // Check if this is a ResizeObserver error
    if (
      errorMessage.includes("ResizeObserver") ||
      (args[0] instanceof Error && args[0].message.includes("ResizeObserver"))
    ) {
      console.warn("🔍 ResizeObserver error detected:", errorMessage)
      console.warn("📊 Components potentially using ResizeObserver:", Array.from(resizeObserverUsers))

      // Get the current component stack if available
      const stack = new Error().stack || ""
      console.warn("📑 Current stack:", stack)

      // Log the error but don't show it in the console to reduce noise
      if (!ENABLE_DETAILED_LOGGING) return
    }

    // Call the original console.error for other errors
    originalConsoleError.apply(console, args)
  }

  // Add a global error handler to catch unhandled errors
  window.addEventListener("error", (event) => {
    if (event.error?.message?.includes("ResizeObserver") || event.message?.includes("ResizeObserver")) {
      console.warn("🚨 Unhandled ResizeObserver error:", event.error || event.message)
      console.warn("📊 Components potentially using ResizeObserver:", Array.from(resizeObserverUsers))

      // Prevent the error from showing in the console
      if (!ENABLE_DETAILED_LOGGING) {
        event.preventDefault()
      }
    }
  })
}

/**
 * Register a component as a potential ResizeObserver user
 * Currently disabled but kept for future debugging
 */
export function registerResizeObserverUser(componentName: string) {
  if (!ENABLE_MONITOR) return () => {}

  resizeObserverUsers.add(componentName)
  console.debug(`📏 Registered potential ResizeObserver user: ${componentName}`)
  return () => {
    resizeObserverUsers.delete(componentName)
    console.debug(`📏 Unregistered ResizeObserver user: ${componentName}`)
  }
}

/**
 * Create a wrapped ResizeObserver with debug logging
 * Currently disabled but kept for future debugging
 */
export function createDebugResizeObserver(callback: ResizeObserverCallback, componentName: string): ResizeObserver {
  if (!ENABLE_MONITOR) {
    // Return a regular ResizeObserver without debugging
    return new ResizeObserver(callback)
  }

  console.debug(`📏 Creating ResizeObserver for ${componentName}`)

  // Register this component
  registerResizeObserverUser(componentName)

  // Create the observer with additional logging
  return new ResizeObserver((...args) => {
    console.debug(`📏 ResizeObserver callback triggered for ${componentName}`)
    try {
      callback(...args)
    } catch (error) {
      console.error(`📏 Error in ResizeObserver callback for ${componentName}:`, error)
    }
  })
}

/**
 * Suppress ResizeObserver errors in production
 * This function is still active even when monitoring is disabled
 */
export function suppressResizeObserverErrors() {
  if (typeof window === "undefined" || process.env.NODE_ENV !== "production") return

  window.addEventListener("error", (event) => {
    if (event.error?.message?.includes("ResizeObserver") || event.message?.includes("ResizeObserver")) {
      // Prevent the error from showing in the console in production
      event.preventDefault()
    }
  })
}

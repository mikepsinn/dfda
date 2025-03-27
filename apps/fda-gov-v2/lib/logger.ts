import pino from 'pino'

const isDev = process.env.NODE_ENV !== 'production'
const isClient = typeof window !== 'undefined'

// Get log level from env or default to 'info' in prod and 'debug' in dev
const LOG_LEVEL = process.env.NEXT_PUBLIC_LOG_LEVEL || (isDev ? 'debug' : 'info')

type LogFn = (message: string, ...args: any[]) => void
interface Logger {
  trace: LogFn
  debug: LogFn
  info: LogFn
  warn: LogFn
  error: LogFn
  fatal: LogFn
  child: (bindings: object) => Logger
}

// Helper to safely stringify objects with circular references
const safeStringify = (obj: any): string => {
  const seen = new WeakSet()
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]'
      }
      seen.add(value)
    }
    return value
  }, 2)
}

// Create the appropriate logger based on environment
const createUnifiedLogger = (name = 'app'): Logger => {
  // In the browser or development, use a simple console-based logger
  if (isClient || isDev) {
    const logLevels = {
      trace: 10,
      debug: 20,
      info: 30,
      warn: 40,
      error: 50,
      fatal: 60
    }

    const shouldLog = (level: keyof typeof logLevels): boolean => {
      const configuredLevel = logLevels[LOG_LEVEL as keyof typeof logLevels] || logLevels.info
      return logLevels[level] >= configuredLevel
    }

    const log = (level: keyof typeof logLevels, name: string, message: string, ...args: any[]): void => {
      if (!shouldLog(level)) return

      const timestamp = new Date().toISOString()
      const data = args.map(arg => typeof arg === 'object' ? safeStringify(arg) : arg)
      
      const color = level === 'error' || level === 'fatal' ? '\x1b[31m' : 
                   level === 'warn' ? '\x1b[33m' : 
                   level === 'info' ? '\x1b[32m' : '\x1b[36m'

      console.log(
        `${color}[${timestamp}] ${level.toUpperCase()} [${name}]: ${message}\x1b[0m`,
        ...data
      )
    }

    return {
      trace: (message: string, ...args: any[]) => log('trace', name, message, ...args),
      debug: (message: string, ...args: any[]) => log('debug', name, message, ...args),
      info: (message: string, ...args: any[]) => log('info', name, message, ...args),
      warn: (message: string, ...args: any[]) => log('warn', name, message, ...args),
      error: (message: string, ...args: any[]) => log('error', name, message, ...args),
      fatal: (message: string, ...args: any[]) => log('fatal', name, message, ...args),
      child: (bindings: object) => createUnifiedLogger(`${name}:${Object.values(bindings).join(':')}`)
    }
  }

  // In production server-side, use Pino
  return pino({
    name,
    level: LOG_LEVEL,
    transport: isDev ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        ignore: 'pid,hostname',
        translateTime: 'HH:MM:ss.l',
      },
    } : undefined,
  })
}

// Export a single logger instance
export const logger = createUnifiedLogger()

// Helper to create child loggers when needed
export const createLogger = (name: string) => logger.child({ name }) 
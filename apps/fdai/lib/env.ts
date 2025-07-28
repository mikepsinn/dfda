// Define the structure of our environment variables
export interface EnvVariables {
  // AI Providers
  OPENAI_API_KEY?: string
  GOOGLE_API_KEY?: string
  DEEPSEEK_API_KEY?: string

  // AI Configuration
  AI_PROVIDER: "openai" | "google" | "deepseek"
  AI_MODEL: string

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string
  SUPABASE_SERVICE_ROLE_KEY: string

  // Application
  NEXT_PUBLIC_SITE_URL: string
}

// Default values for optional environment variables
const defaultValues: Partial<EnvVariables> = {
  AI_PROVIDER: "openai", // Default provider if not specified
  AI_MODEL: "gpt-4o", // Default model if not specified
}

// Required environment variables that must be set
const requiredVariables: Array<keyof EnvVariables> = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"]

// Function to validate environment variables
export function validateEnv(): { valid: boolean; missingVars: string[] } {
  const missingVars: string[] = []

  for (const varName of requiredVariables) {
    if (!process.env[varName]) {
      missingVars.push(varName)
    }
  }

  // Check if at least one AI provider is configured
  const hasOpenAI = !!process.env.OPENAI_API_KEY
  const hasGoogleAI = !!process.env.GOOGLE_API_KEY
  const hasDeepseek = !!process.env.DEEPSEEK_API_KEY

  if (!hasOpenAI && !hasGoogleAI && !hasDeepseek) {
    missingVars.push("AI_PROVIDER_KEY")
  }

  return {
    valid: missingVars.length === 0,
    missingVars,
  }
}

// Function to get environment variables with type safety
export function getEnv(): EnvVariables {
  // Apply default values for optional variables
  const env = { ...defaultValues } as EnvVariables

  // Add all available environment variables
  for (const key in process.env) {
    if (key in env || requiredVariables.includes(key as keyof EnvVariables)) {
      ;(env as any)[key] = process.env[key]
    }
  }

  return env
}

// Function to check if we can use AI features
export function canUseAI(): boolean {
  const hasOpenAI = !!process.env.OPENAI_API_KEY
  const hasGoogleAI = !!process.env.GOOGLE_API_KEY
  const hasDeepseek = !!process.env.DEEPSEEK_API_KEY

  return hasOpenAI || hasGoogleAI || hasDeepseek
}

// Function to get the configured AI provider
export function getAIProvider(): string {
  return process.env.AI_PROVIDER?.toLowerCase() || "openai"
}

// Function to get the configured AI model for the current provider
export function getAIModel(): string {
  return process.env.AI_MODEL || ""
}

export function isDebugMode(): boolean {
  return process.env.DEBUG_MODE === "true"
}

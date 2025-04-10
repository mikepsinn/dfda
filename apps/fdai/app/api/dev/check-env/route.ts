import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
  // Only available in development mode
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ valid: true })
  }

  // For backward compatibility
  const { valid, missingVars } = validateEnv()

  return NextResponse.json({
    valid,
    missingVars,
  })
}

export async function POST(request: NextRequest) {
  // Only available in development mode
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ valid: true })
  }

  try {
    const { variables } = await request.json()

    if (!Array.isArray(variables)) {
      return NextResponse.json({ error: "Invalid request. Expected variables array." }, { status: 400 })
    }

    const values: Record<string, string | undefined> = {}

    for (const variable of variables) {
      values[variable] = process.env[variable]
    }

    return NextResponse.json({ values })
  } catch (error) {
    console.error("Error checking environment variables:", error)
    return NextResponse.json({ error: "Failed to check environment variables" }, { status: 500 })
  }
}

// Helper function to validate environment variables
function validateEnv() {
  const missingVars: string[] = []

  // Check required variables
  const requiredVars = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"]
  for (const varName of requiredVars) {
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

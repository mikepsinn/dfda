import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Add any additional health checks here (e.g., database connection)
    return NextResponse.json({ status: 'healthy' }, { status: 200 })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ status: 'unhealthy', error: errorMessage }, { status: 500 })
  }
} 
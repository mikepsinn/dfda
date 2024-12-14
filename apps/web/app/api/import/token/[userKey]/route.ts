import vital from '@/lib/vital-client'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { userKey: string } }
) {
  try {
    const data = await vital.Link.create(params.userKey)
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create token' },
      { status: 500 }
    )
  }
} 
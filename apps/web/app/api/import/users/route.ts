import vitalClient from '@/lib/vital-client'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { client_user_id } = body

    if (!client_user_id) {
      return NextResponse.json(
        { error: 'client_user_id is required' },
        { status: 400 }
      )
    }

    const data = await vitalClient.user.create(client_user_id)
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const data = await vitalClient.user.getAll()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
} 
import vitalClient  from '@/lib/vital-client'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'start_date and end_date are required' },
        { status: 400 }
      )
    }

    const [sleep, activity, body, workouts] = await Promise.all([
      vitalClient.sleep.get(params.userId, {startDate, endDate}),
      vitalClient.activity.get(params.userId, {startDate, endDate}),
      vitalClient.body.get(params.userId, {startDate, endDate}),
      vitalClient.workouts.get(params.userId, {startDate, endDate}),
    ])

    return NextResponse.json({
      sleep,
      activity,
      body,
      workouts,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    )
  }
} 
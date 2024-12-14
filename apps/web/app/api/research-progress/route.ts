import { researchEvents } from '@/lib/agents/researcher/researcher'
import { NextResponse } from 'next/server'

export async function GET() {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      researchEvents.on('research-progress', (data) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      })
    },
    cancel() {
      researchEvents.removeAllListeners('research-progress')
    },
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
} 
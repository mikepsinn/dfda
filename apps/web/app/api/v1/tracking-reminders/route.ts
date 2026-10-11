/** REST v1: the user's tracking reminders. */
import { preflightResponse } from '@/lib/api/resource-auth'
import { jsonBody, queryInput, runRestOperation } from '@/lib/api/rest'

export function GET(req: Request) {
  return runRestOperation(req, 'listTrackingReminders', () => queryInput(req, { booleans: ['includeInactive'] }))
}

// Creates a reminder, or changes the one that trackingReminderId names.
export function POST(req: Request) {
  return runRestOperation(req, 'upsertTrackingReminder', () => jsonBody(req), {
    status: (result) => ((result as { created: boolean }).created ? 201 : 200),
  })
}

export function OPTIONS() {
  return preflightResponse('GET, POST, OPTIONS')
}

/** REST v1: the notifications of the user's reminders. */
import { preflightResponse } from '@/lib/api/resource-auth'
import { queryInput, runRestOperation } from '@/lib/api/rest'

export function GET(req: Request) {
  return runRestOperation(req, 'listTrackingReminderNotifications', () => queryInput(req, { numbers: ['limit'] }))
}

export function OPTIONS() {
  return preflightResponse('GET, OPTIONS')
}

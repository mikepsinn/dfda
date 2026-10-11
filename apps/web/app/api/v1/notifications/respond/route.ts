/** REST v1: answer reminder notifications. */
import { preflightResponse } from '@/lib/api/resource-auth'
import { jsonBody, runRestOperation } from '@/lib/api/rest'

// A body with notificationId answers one notification; without it, the body
// answers several (notificationIds, or all that are due).
export async function POST(req: Request) {
  let body: Record<string, unknown> | null = null
  const readBody = async () => (body ??= await jsonBody(req))
  const single = await readBody().then((value) => value.notificationId !== undefined, () => false)
  return runRestOperation(req, single ? 'respondToTrackingReminder' : 'respondToTrackingReminderNotifications', readBody)
}

export function OPTIONS() {
  return preflightResponse('POST, OPTIONS')
}

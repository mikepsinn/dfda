/** REST v1: one of the user's tracking reminders. */
import { preflightResponse } from '@/lib/api/resource-auth'
import { jsonBody, runRestOperation } from '@/lib/api/rest'

type Context = { params: Promise<{ id: string }> }

export function GET(req: Request, context: Context) {
  return runRestOperation(req, 'getTrackingReminder', async () => ({ trackingReminderId: (await context.params).id }))
}

export function PATCH(req: Request, context: Context) {
  return runRestOperation(req, 'upsertTrackingReminder', async () => ({
    ...(await jsonBody(req)),
    trackingReminderId: (await context.params).id,
  }))
}

export function DELETE(req: Request, context: Context) {
  return runRestOperation(req, 'deleteTrackingReminder', async () => ({ trackingReminderId: (await context.params).id }))
}

export function OPTIONS() {
  return preflightResponse('GET, PATCH, DELETE, OPTIONS')
}

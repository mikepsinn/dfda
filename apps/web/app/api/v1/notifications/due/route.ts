/** REST v1: the notifications that are due now and not answered. */
import { preflightResponse } from '@/lib/api/resource-auth'
import { queryInput, runRestOperation } from '@/lib/api/rest'

export function GET(req: Request) {
  return runRestOperation(req, 'listDueTrackingReminders', () => queryInput(req, { numbers: ['limit'] }))
}

export function OPTIONS() {
  return preflightResponse('GET, OPTIONS')
}

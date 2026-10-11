/** REST v1: correct or delete one of the user's measurements. */
import { preflightResponse } from '@/lib/api/resource-auth'
import { jsonBody, runRestOperation } from '@/lib/api/rest'

type Context = { params: Promise<{ id: string }> }

export function PATCH(req: Request, context: Context) {
  return runRestOperation(req, 'updateMeasurement', async () => ({
    ...(await jsonBody(req)),
    measurementId: (await context.params).id,
  }))
}

export function DELETE(req: Request, context: Context) {
  return runRestOperation(req, 'deleteMeasurement', async () => ({ measurementId: (await context.params).id }))
}

export function OPTIONS() {
  return preflightResponse('PATCH, DELETE, OPTIONS')
}

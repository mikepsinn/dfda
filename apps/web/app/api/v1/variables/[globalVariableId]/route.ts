/** REST v1: one variable. */
import { preflightResponse } from '@/lib/api/resource-auth'
import { runRestOperation } from '@/lib/api/rest'

type Context = { params: Promise<{ globalVariableId: string }> }

export function GET(req: Request, context: Context) {
  return runRestOperation(req, 'getVariable', async () => ({ globalVariableId: (await context.params).globalVariableId }))
}

export function OPTIONS() {
  return preflightResponse('GET, OPTIONS')
}

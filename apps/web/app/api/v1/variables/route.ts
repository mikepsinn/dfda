/** REST v1: search the variables that can be tracked. */
import { preflightResponse } from '@/lib/api/resource-auth'
import { queryInput, runRestOperation } from '@/lib/api/rest'

export function GET(req: Request) {
  return runRestOperation(req, 'searchVariables', () => queryInput(req, { numbers: ['limit'] }))
}

export function OPTIONS() {
  return preflightResponse('GET, OPTIONS')
}

/** REST v1: the user's measurements. */
import { preflightResponse } from '@/lib/api/resource-auth'
import { jsonBody, queryInput, runRestOperation } from '@/lib/api/rest'

export function GET(req: Request) {
  return runRestOperation(req, 'listMeasurements', () => queryInput(req, { numbers: ['limit'] }))
}

export function POST(req: Request) {
  return runRestOperation(req, 'recordMeasurement', () => jsonBody(req), { status: () => 201 })
}

export function OPTIONS() {
  return preflightResponse('GET, POST, OPTIONS')
}

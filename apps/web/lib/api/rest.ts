import { z } from 'zod/v4'
import { invalidArgument } from '@/lib/tracking/errors'
import { trackingOperations, type TrackingOperation, type TrackingOperationName } from '@/lib/tracking/operations'
import { authenticateRequest, corsHeaders, errorResponse, insufficientScopeResponse, operationErrorResponse } from './resource-auth'

/**
 * Runs a tracking operation for a REST API request (app/api/v1): checks the
 * access token and its scope, validates the input with the operation's schema
 * and returns the result as JSON.
 */
export async function runRestOperation(
  req: Request,
  name: TrackingOperationName,
  readInput: () => Promise<Record<string, unknown>> | Record<string, unknown>,
  options: { status?: (result: unknown) => number } = {},
): Promise<Response> {
  const token = await authenticateRequest(req, 'rest')
  if (token instanceof Response) return token
  const operation = trackingOperations[name] as unknown as TrackingOperation
  if (!token.scopes.includes(operation.scope)) return insufficientScopeResponse('rest', operation.scope, token.origin)

  try {
    const parsed = operation.input.safeParse(await readInput())
    if (!parsed.success) {
      return errorResponse(400, 'INVALID_ARGUMENT', z.prettifyError(parsed.error), {
        details: parsed.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
      })
    }
    const result = await operation.run(token.userId, parsed.data)
    return Response.json(result, { status: options.status?.(result) ?? 200, headers: corsHeaders })
  } catch (error) {
    return operationErrorResponse(error, `${req.method} ${new URL(req.url).pathname}`)
  }
}

/** The query parameters as input; `numbers` and `booleans` name the parameters to convert. */
export function queryInput(req: Request, types: { numbers?: string[]; booleans?: string[] } = {}) {
  const input: Record<string, unknown> = {}
  for (const [key, value] of new URL(req.url).searchParams) {
    if (types.numbers?.includes(key)) input[key] = value === '' ? undefined : Number(value)
    else if (types.booleans?.includes(key)) input[key] = value === 'true' ? true : value === 'false' ? false : value
    else input[key] = value
  }
  return input
}

/** The JSON object in the request body. */
export async function jsonBody(req: Request): Promise<Record<string, unknown>> {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    throw invalidArgument('The request body must be a JSON object.')
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw invalidArgument('The request body must be a JSON object.')
  }
  return body as Record<string, unknown>
}

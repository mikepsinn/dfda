/**
 * An error that the tracking API reports to the caller: the REST API as an
 * HTTP status, the MCP server as a tool error. Other errors are server errors
 * and are logged, not shown.
 */
export type TrackingErrorCode = 'INVALID_ARGUMENT' | 'NOT_FOUND'

const httpStatus: Record<TrackingErrorCode, number> = {
  INVALID_ARGUMENT: 400,
  NOT_FOUND: 404,
}

export class TrackingError extends Error {
  readonly status: number

  constructor(
    readonly code: TrackingErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'TrackingError'
    this.status = httpStatus[code]
  }
}

export function invalidArgument(message: string): TrackingError {
  return new TrackingError('INVALID_ARGUMENT', message)
}

export function notFound(message: string): TrackingError {
  return new TrackingError('NOT_FOUND', message)
}

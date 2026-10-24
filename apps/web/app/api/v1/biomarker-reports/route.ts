/**
 * REST v1: a laboratory, or another system of the company, sends a biomarker
 * report to the company's care team, with an import key of the company
 * (lib/care-team/import.ts). Server to server: no browser calls it, so it
 * sends no CORS headers.
 */
import { after } from 'next/server'
import { ImportError, importReport } from '@/lib/care-team/import'
import { MAX_REPORT_FILE_BYTES } from '@/lib/care-team/format'
import { notifyReport } from '@/lib/care-team/notify'
import { logger } from '@/lib/logger'

/** The report and the few fields around it. */
const MAX_BODY_BYTES = MAX_REPORT_FILE_BYTES + 4_000

function error(status: number, code: string, message: string, details?: { path: string; message: string }[]) {
  return Response.json({ error: { code, message, ...(details ? { details } : {}) } }, { status })
}

export async function POST(req: Request) {
  const key = req.headers.get('authorization')?.match(/^Bearer\s+(\S+)$/i)?.[1]
  if (!key) return error(401, 'UNAUTHENTICATED', "Send the company's import key in the Authorization header: Bearer <key>.")
  if (Number(req.headers.get('content-length') ?? 0) > MAX_BODY_BYTES) {
    return error(413, 'TOO_LARGE', 'The report is larger than 900 KB.')
  }
  const text = await req.text()
  if (Buffer.byteLength(text) > MAX_BODY_BYTES) return error(413, 'TOO_LARGE', 'The report is larger than 900 KB.')
  let body: unknown
  try {
    body = JSON.parse(text)
  } catch {
    return error(400, 'INVALID_ARGUMENT', 'The request body must be a JSON object.')
  }

  try {
    const result = await importReport(key, body)
    if (result.created) after(() => notifyReport('added', result.id))
    return Response.json(result, { status: result.created ? 201 : 200 })
  } catch (caught) {
    if (caught instanceof ImportError) return error(caught.status, caught.code, caught.message, caught.details)
    logger.error('Could not import a biomarker report', { error: caught instanceof Error ? caught.message : String(caught) })
    return error(500, 'INTERNAL', 'The import failed. Try again later.')
  }
}

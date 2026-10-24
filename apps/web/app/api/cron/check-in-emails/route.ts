import { timingSafeEqual } from 'node:crypto'
import { env } from '@/lib/env'
import { logger } from '@/lib/logger'
import { sendCheckInEmails } from '@/lib/programs/check-in'

export const dynamic = 'force-dynamic'
// The emails that do not fit in one run stay due, and the next run sends them.
export const maxDuration = 60

// Sends the daily check-in emails that are due (lib/programs/check-in.ts). A
// scheduler calls it every hour with `Authorization: Bearer <CRON_SECRET>`:
// .github/workflows/check-in-emails.yml, or a Vercel cron job, which sends the
// header itself. Without CRON_SECRET the emails are off.
export async function GET(request: Request) {
  if (!env.CRON_SECRET) {
    return Response.json({ error: 'The check-in emails are off: CRON_SECRET is not set.' }, { status: 503 })
  }
  const given = Buffer.from(request.headers.get('authorization') ?? '')
  const expected = Buffer.from(`Bearer ${env.CRON_SECRET}`)
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const counts = await sendCheckInEmails()
    if (counts.due > 0) logger.info('Sent the check-in emails', counts)
    return Response.json(counts, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    logger.error('Could not send the check-in emails', { error: error instanceof Error ? error.message : String(error) })
    return Response.json({ error: 'Could not send the check-in emails.' }, { status: 500 })
  }
}

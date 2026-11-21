import { timingSafeEqual } from 'node:crypto'
import { analyzeDuePeople } from '@/lib/analysis/relationships'
import { env } from '@/lib/env'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'
// The people that do not fit in one run stay due, and the next run analyzes them.
export const maxDuration = 60

// Recomputes the predictor and outcome relationships of the people whose
// measurements changed (lib/analysis/relationships.ts). A scheduler calls it
// every hour with `Authorization: Bearer <CRON_SECRET>`:
// .github/workflows/relationships.yml, or a Vercel cron job, which sends the
// header itself. Without CRON_SECRET the analysis is off.
export async function GET(request: Request) {
  if (!env.CRON_SECRET) {
    return Response.json({ error: 'The relationship analysis is off: CRON_SECRET is not set.' }, { status: 503 })
  }
  const given = Buffer.from(request.headers.get('authorization') ?? '')
  const expected = Buffer.from(`Bearer ${env.CRON_SECRET}`)
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const run = await analyzeDuePeople({ deadline: Date.now() + 45_000 })
    if (run.due > 0) logger.info('Analyzed relationships', run)
    return Response.json(run, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    logger.error('Could not analyze relationships', { error: error instanceof Error ? error.message : String(error) })
    return Response.json({ error: 'Could not analyze relationships.' }, { status: 500 })
  }
}

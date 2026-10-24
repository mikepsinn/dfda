import { createHmac } from 'node:crypto'
import { adminDb } from '@/lib/db'
import { env } from '@/lib/env'

/**
 * The accounts of a company site's demo mode (lib/demo/instance.ts), and how
 * the demo ends. In a module of their own, so that the company totals and the
 * report emails can leave the demo people out without importing the demo's
 * data. The demo sign-in records both accounts by user id in
 * instance_demo_accounts, which users cannot change
 * (db/migrations/20261024030000_table_instance_demo_accounts.sql): there the
 * database gives the demo clinician the demo patient only, and never gives the
 * demo patient to the real care team.
 */

/**
 * The key of the advisory lock that orders the changes of a site's demo: its
 * start, a demo sign-in and its end. Each holds it until its transaction ends,
 * so that a sign-in in progress cannot put the demo people back after the demo
 * ended.
 */
export const demoLockKey = (instanceId: string) => `instance-demo:${instanceId}`

/** The demo patient's and the demo clinician's emails, and their password, derived from the server's secret. */
export function instanceDemoAccounts(instanceId: string) {
  return {
    patient: `demo-patient-${instanceId}@example.com`,
    clinician: `demo-clinician-${instanceId}@example.com`,
    password: createHmac('sha256', env.BETTER_AUTH_SECRET).update(`instance-demo:${instanceId}`).digest('hex'),
  }
}

/** The user ids of the site's demo accounts, both roles. */
export async function demoAccountIds(instanceId: string): Promise<Set<string>> {
  const rows = await adminDb.instance_demo_accounts.findMany({ where: { instance_id: instanceId }, select: { user_id: true } })
  return new Set(rows.map((row) => row.user_id))
}

/**
 * Turns the site's demo off and removes the demo people from it: the
 * clinician from the care team, and the patient's enrollments, reports and
 * values. The accounts stay, unused: only the demo sign-in knows their password.
 */
export async function endInstanceDemo(instanceId: string) {
  await adminDb.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${demoLockKey(instanceId)}))`
    await tx.instances.updateMany({ where: { id: instanceId }, data: { demo_enabled: false } })
    const ids = (await tx.instance_demo_accounts.findMany({ where: { instance_id: instanceId }, select: { user_id: true } })).map((row) => row.user_id)
    if (!ids.length) return
    const where = { user_id: { in: ids }, instance_programs: { instance_id: instanceId } }
    await tx.instance_clinicians.deleteMany({ where: { instance_id: instanceId, user_id: { in: ids } } })
    await tx.biomarker_reports.deleteMany({ where })
    await tx.program_enrollments.deleteMany({ where })
    await tx.measurements.deleteMany({ where: { user_id: { in: ids } } })
  })
}

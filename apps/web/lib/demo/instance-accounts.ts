import { createHmac } from 'node:crypto'
import { adminDb } from '@/lib/db'
import { env } from '@/lib/env'

/**
 * The accounts of a company site's demo mode (lib/demo/instance.ts), and how
 * the demo ends. In a module of their own, so that joining a program
 * (lib/programs/manage.ts) can end a demo without importing the demo's data.
 */

/** The demo patient's and the demo clinician's emails, and their password, derived from the server's secret. */
export function instanceDemoAccounts(instanceId: string) {
  return {
    patient: `demo-patient-${instanceId}@example.com`,
    clinician: `demo-clinician-${instanceId}@example.com`,
    password: createHmac('sha256', env.BETTER_AUTH_SECRET).update(`instance-demo:${instanceId}`).digest('hex'),
  }
}

/**
 * Turns the site's demo off and removes the demo people from it: the
 * clinician from the care team, and the patient's enrollments, reports and
 * values. The accounts stay, unused: only the demo sign-in knows their password.
 */
export async function endInstanceDemo(instanceId: string) {
  const { patient, clinician } = instanceDemoAccounts(instanceId)
  const ids = (await adminDb.users.findMany({ where: { email: { in: [patient, clinician] } }, select: { id: true } })).map((user) => user.id)
  await adminDb.$transaction(async (tx) => {
    await tx.instances.updateMany({ where: { id: instanceId }, data: { demo_enabled: false } })
    if (!ids.length) return
    const where = { user_id: { in: ids }, instance_programs: { instance_id: instanceId } }
    await tx.instance_clinicians.deleteMany({ where: { instance_id: instanceId, user_id: { in: ids } } })
    await tx.biomarker_reports.deleteMany({ where })
    await tx.program_enrollments.deleteMany({ where })
    await tx.measurements.deleteMany({ where: { user_id: { in: ids } } })
  })
}

/**
 * Before a person joins a program: when the program's site shows a demo, the
 * demo ends first, so that the demo clinician, whose account any visitor can
 * use, never sees a real person. The demo patient never joins this way.
 */
export async function endDemoBeforeJoin(instanceId: string) {
  const instance = await adminDb.instances.findUnique({ where: { id: instanceId }, select: { demo_enabled: true } })
  if (instance?.demo_enabled) await endInstanceDemo(instanceId)
}

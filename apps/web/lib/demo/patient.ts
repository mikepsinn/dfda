import demo from '@/scripts/demo-data.json'
import { adminDb } from '@/lib/db'

/**
 * Whether a user is a demo patient of an instance: the patient of a company
 * site's demo (instance_demo_accounts, lib/demo/instance.ts), or the demo
 * patient of the network's demo clinic (lib/demo/clinic.ts). Their values and
 * reports are made up, so they may go to the Claude API, which gets no real
 * health data until there is a business associate agreement. Server only.
 */
export async function isDemoPatient(instanceId: string, userId: string): Promise<boolean> {
  const site = await adminDb.instance_demo_accounts.findFirst({
    where: { instance_id: instanceId, user_id: userId, role: 'patient' },
    select: { user_id: true },
  })
  if (site) return true
  if (instanceId !== demo.instance.id) return false
  const patient = await adminDb.users.findUnique({ where: { email: demo.patient.email }, select: { id: true } })
  return patient?.id === userId
}

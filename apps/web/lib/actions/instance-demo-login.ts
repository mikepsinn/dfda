"use server"

import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { DemoUnavailable, prepareInstanceDemo, type InstanceDemoRole } from '@/lib/demo/instance'
import { resolveInstance } from '@/lib/instance/resolve'
import { createLogger } from '@/lib/logger'

const logger = createLogger('instance-demo-login')

/**
 * Signs a visitor of a company's site in to its demo (lib/demo/instance.ts):
 * as the demo patient, who opens their program, or as the demo clinician, who
 * opens the patient's case. Only on a site whose owner turned the demo on.
 * The caller opens `redirectUrl` with a full page load.
 */
export async function instanceDemoLogin(role: InstanceDemoRole): Promise<{ success: boolean; error?: string; redirectUrl?: string }> {
  const instance = await resolveInstance()
  if (!instance?.demoEnabled) return { success: false, error: 'This site has no demo.' }
  try {
    const demo = await prepareInstanceDemo(instance.id, role)
    // The session cookie is set on the response (nextCookies in lib/auth.ts).
    await auth.api.signInEmail({ body: { email: demo.email, password: demo.password }, headers: await headers() })
    const redirectUrl = role === 'patient' ? `/programs/${demo.program.slug}/me` : `/instances/${demo.slug}/care/${demo.enrollmentId}`
    return { success: true, redirectUrl }
  } catch (error) {
    if (error instanceof DemoUnavailable) return { success: false, error: error.message }
    logger.error('Demo sign-in failed', { instanceId: instance.id, role, error: error instanceof Error ? error.message : String(error) })
    return { success: false, error: 'Could not open the demo. Try again.' }
  }
}

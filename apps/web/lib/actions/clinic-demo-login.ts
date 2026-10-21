"use server"

import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { DEMO_CLINIC as demo, ensureDemoClinic, ensureDemoMembers, hasDemoMembers, resetDemoPatient } from '@/lib/demo/clinic'
import { createLogger } from '@/lib/logger'

const logger = createLogger('clinic-demo-login')

export type ClinicDemoRole = 'owner' | 'patient'

/**
 * Signs in to the demo clinic (lib/demo/clinic.ts) as its owner or as its
 * patient, and creates the clinic on first use. The patient gets fresh values
 * and opens their program on the clinic's own site, through its preview link;
 * the owner opens the clinic's page for companies. The caller opens
 * `redirectUrl` with a full page load, so that the preview link can set its
 * cookie.
 */
export async function clinicDemoLogin(role: ClinicDemoRole): Promise<{ success: boolean; error?: string; redirectUrl?: string }> {
  try {
    const { program } = await ensureDemoClinic()
    if (!(await hasDemoMembers(program))) await ensureDemoMembers(program)
    if (role === 'patient') await resetDemoPatient(program)

    // The session cookie is set on the response (nextCookies in lib/auth.ts).
    await auth.api.signInEmail({
      body: { email: role === 'owner' ? demo.company.email : demo.patient.email, password: demo.password },
      headers: await headers(),
    })
    const redirectUrl =
      role === 'owner'
        ? `/instances/${demo.instance.slug}`
        : `/i/${demo.instance.slug}?next=${encodeURIComponent(`/programs/${program.slug}/me`)}`
    return { success: true, redirectUrl }
  } catch (error) {
    logger.error('Demo clinic sign-in failed', { role, error: error instanceof Error ? error.message : String(error) })
    return { success: false, error: 'Could not open the demo clinic. Try again.' }
  }
}

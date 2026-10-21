"use server"

import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { DEMO_CLINIC as demo, prepareDemoClinic, resetDemoPatient, resetDemoReview } from '@/lib/demo/clinic'
import { createLogger } from '@/lib/logger'

const logger = createLogger('clinic-demo-login')

export type ClinicDemoRole = 'owner' | 'patient' | 'clinician'

/**
 * Signs in to the demo clinic (lib/demo/clinic.ts) as its owner, its patient
 * or its clinician, and creates the clinic on first use. The patient gets
 * fresh values and opens their program on the clinic's own site, through its
 * preview link; the owner opens the clinic's page for companies; the clinician
 * opens the care team's patients on the clinic's site, with the patient's
 * report open for review. The caller opens
 * `redirectUrl` with a full page load, so that the preview link can set its
 * cookie.
 */
export async function clinicDemoLogin(role: ClinicDemoRole): Promise<{ success: boolean; error?: string; redirectUrl?: string }> {
  try {
    const { program, slug, patientId } = await prepareDemoClinic()
    if (role === 'patient') await resetDemoPatient(program, patientId)
    if (role === 'clinician') await resetDemoReview()
    const email = { owner: demo.company.email, patient: demo.patient.email, clinician: demo.clinician.email }[role]

    // The session cookie is set on the response (nextCookies in lib/auth.ts).
    await auth.api.signInEmail({
      body: { email, password: demo.password },
      headers: await headers(),
    })
    // The current addresses: the owner may change them.
    const redirectUrl = {
      owner: `/instances/${slug}`,
      clinician: `/i/${slug}?next=${encodeURIComponent(`/instances/${slug}/care`)}`,
      patient: `/i/${slug}?next=${encodeURIComponent(`/programs/${program.slug}/me`)}`,
    }[role]
    return { success: true, redirectUrl }
  } catch (error) {
    logger.error('Demo clinic sign-in failed', { role, error: error instanceof Error ? error.message : String(error) })
    return { success: false, error: 'Could not open the demo clinic. Try again.' }
  }
}

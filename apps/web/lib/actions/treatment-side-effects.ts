"use server"

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { SideEffectFormState } from '@/lib/actions/programs'
import { logger } from '@/lib/logger'
import { ProgramError } from '@/lib/programs/manage'
import { trackSymptom, unlinkSymptom } from '@/lib/programs/side-effects'
import { getServerUser } from '@/lib/server-auth'

// The side effects of a treatment are symptoms from the catalog that the person
// links to it (patient_side_effects), rated as measurements (lib/programs/side-effects.ts).

function revalidateTreatment(patientTreatmentId: string) {
  revalidatePath(`/patient/treatments/${patientTreatmentId}`)
  revalidatePath(`/patient/treatments/${patientTreatmentId}/side-effects`)
}

/** Adds a side effect to a treatment: the link, a daily reminder, and today's rating when they gave one. */
export async function trackSideEffectAction(
  patientTreatmentId: string,
  _state: SideEffectFormState,
  formData: FormData,
): Promise<SideEffectFormState> {
  const user = await getServerUser()
  if (!user) return { error: 'Sign in to add a side effect.' }
  try {
    const item = await trackSymptom(user, { patientTreatmentId }, {
      variableId: String(formData.get('variableId') ?? ''),
      value: String(formData.get('value') ?? ''),
      date: String(formData.get('date') ?? ''),
    })
    revalidateTreatment(patientTreatmentId)
    return { added: item.name }
  } catch (error) {
    if (error instanceof ProgramError) return { error: error.message }
    logger.error('Could not add a side effect to a treatment', {
      userId: user.id,
      patientTreatmentId,
      error: error instanceof Error ? error.message : String(error),
    })
    return { error: 'Could not add the side effect. Try again.' }
  }
}

/** Adds a symptom that the person rated already as a side effect of a treatment. */
export async function linkSideEffectAction(patientTreatmentId: string, variableId: string, date: string) {
  const user = await getServerUser()
  if (!user) redirect('/login')
  await trackSymptom(user, { patientTreatmentId }, { variableId, value: '', date })
  revalidateTreatment(patientTreatmentId)
}

/** Removes a side effect from a treatment. Its ratings and its reminder stay. */
export async function unlinkSideEffectAction(patientTreatmentId: string, variableId: string) {
  const user = await getServerUser()
  if (!user) redirect('/login')
  await unlinkSymptom(user, { patientTreatmentId }, variableId)
  revalidateTreatment(patientTreatmentId)
}

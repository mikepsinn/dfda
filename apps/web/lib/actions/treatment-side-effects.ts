"use server"

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { SideEffectFormState } from '@/lib/actions/programs'
import { logger } from '@/lib/logger'
import { ProgramError } from '@/lib/programs/manage'
import { addSideEffect, removeSideEffect } from '@/lib/programs/side-effects'
import { getServerUser } from '@/lib/server-auth'

// The side effects of a treatment are the person's symptoms (lib/programs/side-effects.ts):
// a symptom with a daily reminder, and its ratings as measurements.

function revalidateTreatment(patientTreatmentId: string) {
  revalidatePath(`/patient/treatments/${patientTreatmentId}`)
  revalidatePath(`/patient/treatments/${patientTreatmentId}/side-effects`)
}

/** Starts to track a side effect from a treatment's page: a daily reminder, and today's rating when they gave one. */
export async function trackSideEffectAction(
  patientTreatmentId: string,
  _state: SideEffectFormState,
  formData: FormData,
): Promise<SideEffectFormState> {
  const user = await getServerUser()
  if (!user) return { error: 'Sign in to add a side effect.' }
  try {
    const item = await addSideEffect(user, null, {
      variableId: String(formData.get('variableId') ?? ''),
      value: String(formData.get('value') ?? ''),
      date: String(formData.get('date') ?? ''),
    })
    revalidateTreatment(patientTreatmentId)
    return { added: item.name }
  } catch (error) {
    if (error instanceof ProgramError) return { error: error.message }
    logger.error('Could not add a side effect', {
      userId: user.id,
      patientTreatmentId,
      error: error instanceof Error ? error.message : String(error),
    })
    return { error: 'Could not add the side effect. Try again.' }
  }
}

/** Stops tracking a side effect: deletes the user's reminders for it. Its ratings stay. */
export async function stopSideEffectAction(patientTreatmentId: string, variableId: string) {
  const user = await getServerUser()
  if (!user) redirect('/login')
  await removeSideEffect(user, variableId)
  revalidateTreatment(patientTreatmentId)
}

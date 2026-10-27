"use server"

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { SideEffectFormState } from '@/lib/actions/programs'
import { logger } from '@/lib/logger'
import { ProgramError } from '@/lib/programs/manage'
import { trackSymptom, unlinkSymptom } from '@/lib/programs/side-effects'
import { getServerUser } from '@/lib/server-auth'

// The symptoms of a condition are symptoms from the catalog that the person
// links to it (patient_symptoms), rated as measurements (lib/programs/side-effects.ts).

/** Adds a symptom to a condition: the link, a daily reminder, and today's rating when they gave one. */
export async function trackConditionSymptomAction(
  patientConditionId: string,
  _state: SideEffectFormState,
  formData: FormData,
): Promise<SideEffectFormState> {
  const user = await getServerUser()
  if (!user) return { error: 'Sign in to add a symptom.' }
  try {
    const item = await trackSymptom(user, { patientConditionId }, {
      variableId: String(formData.get('variableId') ?? ''),
      value: String(formData.get('value') ?? ''),
      date: String(formData.get('date') ?? ''),
    })
    revalidatePath(`/patient/conditions/${patientConditionId}`)
    return { added: item.name }
  } catch (error) {
    if (error instanceof ProgramError) return { error: error.message }
    logger.error('Could not add a symptom to a condition', {
      userId: user.id,
      patientConditionId,
      error: error instanceof Error ? error.message : String(error),
    })
    return { error: 'Could not add the symptom. Try again.' }
  }
}

/** Removes a symptom from a condition. Its ratings and its reminder stay. */
export async function unlinkConditionSymptomAction(patientConditionId: string, variableId: string) {
  const user = await getServerUser()
  if (!user) redirect('/login')
  await unlinkSymptom(user, { patientConditionId }, variableId)
  revalidatePath(`/patient/conditions/${patientConditionId}`)
}

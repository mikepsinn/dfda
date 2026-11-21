'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { withUserTransaction } from '@/lib/db'
import { createLogger } from '@/lib/logger'
import { isFrequencyId, MAX_TIMES } from '@/lib/patient/reminder-settings'
import { deleteReminders, saveReminderSettings } from '@/lib/patient/reminders'
import { getServerUser } from '@/lib/server-auth'
import { TrackingError } from '@/lib/tracking/errors'
import { afterReminderSaved } from '@/lib/tracking/reminders'
import type { ActionResult } from './recording'

/**
 * The actions of the patient app's reminder form (components/patient/reminder-form),
 * on the signed-in person's own reminders, in one transaction with row-level
 * security. They return a message to show instead of throwing.
 */

const logger = createLogger('patient-reminder-actions')

async function run<T extends object>(name: string, fn: (userId: string) => Promise<T>): Promise<ActionResult<T>> {
  const user = await getServerUser()
  if (!user) return { ok: false, error: 'Sign in again to continue.' }
  try {
    const result = await fn(user.id)
    revalidatePath('/patient', 'layout')
    return { ok: true, ...result }
  } catch (error) {
    if (error instanceof TrackingError) return { ok: false, error: error.message }
    if (error instanceof z.ZodError) return { ok: false, error: 'Check the reminder settings and try again.' }
    logger.error(`Reminder action ${name} failed`, { userId: user.id, error: error instanceof Error ? error.message : String(error) })
    return { ok: false, error: 'Something went wrong. Try again.' }
  }
}

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable()
const settingsInput = z.object({
  globalVariableId: z.string().min(1).max(200),
  frequency: z.string().refine((value) => value === 'custom' || isFrequencyId(value)),
  // A custom schedule may have more times than the form adds, one per schedule.
  times: z.array(time).max(48),
  defaultValue: z.number().finite().nullable(),
  isActive: z.boolean(),
  startDate: day,
  endDate: day,
  unchanged: z.object({ defaultValue: z.boolean(), isActive: z.boolean(), endDate: z.boolean() }).partial().optional(),
})

export async function saveReminderSettingsAction(input: z.input<typeof settingsInput>): Promise<ActionResult<{ userVariableId: string }>> {
  return run('save', async (userId) => {
    const parsed = settingsInput.parse(input)
    if (parsed.frequency !== 'custom' && parsed.times.length > MAX_TIMES) throw new TrackingError('INVALID_ARGUMENT', `Choose at most ${MAX_TIMES} times.`)
    const result = await withUserTransaction({ id: userId }, (tx) =>
      saveReminderSettings(tx, userId, { ...parsed, frequency: parsed.frequency as Parameters<typeof saveReminderSettings>[2]['frequency'] }),
    )
    // After the commit, the worker makes the next notifications of the saved schedules.
    await Promise.all(result.saved.map((schedule) => afterReminderSaved(userId, schedule, schedule.created)))
    return { userVariableId: result.userVariableId }
  })
}

export async function deleteRemindersAction(userVariableId: string): Promise<ActionResult> {
  return run('delete', async (userId) => {
    const id = z.string().uuid().parse(userVariableId)
    await withUserTransaction({ id: userId }, (tx) => deleteReminders(tx, userId, id))
    return {}
  })
}

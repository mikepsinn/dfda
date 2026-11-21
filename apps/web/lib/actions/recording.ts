'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { withUserTransaction } from '@/lib/db'
import { createLogger } from '@/lib/logger'
import { loadHistory, type HistoryFilter, type HistoryPage } from '@/lib/patient/history'
import { findVariables, localToInstant, type VariableSearchResult } from '@/lib/patient/variables'
import { zoneOf } from '@/lib/reminders/schedule'
import { getServerUser } from '@/lib/server-auth'
import { invalidArgument, TrackingError } from '@/lib/tracking/errors'
import { deleteMeasurement, recordMeasurement, updateMeasurement } from '@/lib/tracking/measurements'
import type { TrackingDb } from '@/lib/tracking/variables'

/**
 * The actions of the patient app's variable search, recording form and
 * history (components/patient/recording), over the tracking layer that the
 * MCP server and /api/v1 use. Each acts on the signed-in person's own data in
 * one transaction with row-level security, and returns a message to show
 * instead of throwing.
 */

const logger = createLogger('recording-actions')

export type ActionResult<T = object> = ({ ok: true } & T) | { ok: false; error: string }

async function run<T extends object>(name: string, fn: (userId: string) => Promise<T>): Promise<ActionResult<T>> {
  const user = await getServerUser()
  if (!user) return { ok: false, error: 'Sign in again to continue.' }
  try {
    const result = await fn(user.id)
    return { ok: true, ...result }
  } catch (error) {
    if (error instanceof TrackingError) return { ok: false, error: error.message }
    if (error instanceof z.ZodError) return { ok: false, error: 'Check the values and try again.' }
    logger.error(`Recording action ${name} failed`, { userId: user.id, error: error instanceof Error ? error.message : String(error) })
    return { ok: false, error: 'Something went wrong. Try again.' }
  }
}

/** The patient pages that show measurements. */
function revalidatePatient() {
  revalidatePath('/patient', 'layout')
}

const id = z.string().min(1).max(200)
const measurementFields = z.object({
  value: z.number().finite(),
  unitId: id,
  date: z.string().max(10),
  time: z.string().max(5),
  note: z.string().max(2000),
})

/** The form's local date and time as an instant, in the person's time zone. */
async function startTime(tx: TrackingDb, userId: string, date: string, time: string) {
  const profile = await tx.profiles.findUnique({ where: { id: userId }, select: { timezone: true } })
  const instant = localToInstant(date, time, zoneOf(profile?.timezone))
  if (!instant) throw invalidArgument('Choose a valid date and time.')
  return instant
}

export async function searchVariablesAction(query: string, categoryId: string | null): Promise<ActionResult<{ variables: VariableSearchResult[] }>> {
  return run('search', async (userId) => {
    const input = { query: z.string().max(200).parse(query), categoryId: id.nullable().parse(categoryId) ?? undefined }
    return { variables: await withUserTransaction({ id: userId }, (tx) => findVariables(tx, userId, input)) }
  })
}

export async function recordMeasurementAction(input: z.input<typeof measurementFields> & { globalVariableId: string }): Promise<ActionResult<{ measurementId: string }>> {
  return run('record', async (userId) => {
    const fields = measurementFields.extend({ globalVariableId: id }).parse(input)
    const measurement = await withUserTransaction({ id: userId }, async (tx) =>
      recordMeasurement(tx, userId, {
        globalVariableId: fields.globalVariableId,
        value: fields.value,
        unitId: fields.unitId,
        startTime: await startTime(tx, userId, fields.date, fields.time),
        note: fields.note.trim() || undefined,
      }),
    )
    revalidatePatient()
    return { measurementId: measurement.id }
  })
}

export async function updateMeasurementAction(input: z.input<typeof measurementFields> & { measurementId: string }): Promise<ActionResult> {
  return run('update', async (userId) => {
    const fields = measurementFields.extend({ measurementId: z.string().uuid() }).parse(input)
    await withUserTransaction({ id: userId }, async (tx) =>
      updateMeasurement(tx, userId, {
        measurementId: fields.measurementId,
        value: fields.value,
        unitId: fields.unitId,
        startTime: await startTime(tx, userId, fields.date, fields.time),
        note: fields.note.trim() || null,
      }),
    )
    revalidatePatient()
    return {}
  })
}

/** The next page of History after `cursor`, with the same filter. */
export async function loadHistoryPageAction(filter: HistoryFilter, cursor: string): Promise<ActionResult<HistoryPage>> {
  return run('history', async (userId) => {
    const input = { categoryId: id.optional().parse(filter.categoryId), globalVariableId: id.optional().parse(filter.globalVariableId) }
    return withUserTransaction({ id: userId }, (tx) => loadHistory(tx, userId, input, z.string().max(500).parse(cursor)))
  })
}

/** Deletes a measurement; its row stays, so restoreMeasurementAction can undo it. */
export async function deleteMeasurementAction(measurementId: string): Promise<ActionResult> {
  return run('delete', async (userId) => {
    const measurement = z.string().uuid().parse(measurementId)
    await withUserTransaction({ id: userId }, (tx) => deleteMeasurement(tx, userId, measurement))
    revalidatePatient()
    return {}
  })
}

/** Undoes deleteMeasurementAction. */
export async function restoreMeasurementAction(measurementId: string): Promise<ActionResult> {
  return run('restore', async (userId) => {
    const measurement = z.string().uuid().parse(measurementId)
    const { count } = await withUserTransaction({ id: userId }, (tx) =>
      tx.measurements.updateMany({
        where: { id: measurement, user_id: userId, deleted_at: { not: null } },
        data: { deleted_at: null, updated_at: new Date() },
      }),
    )
    if (count === 0) throw new TrackingError('NOT_FOUND', 'That measurement can no longer be restored.')
    revalidatePatient()
    return {}
  })
}

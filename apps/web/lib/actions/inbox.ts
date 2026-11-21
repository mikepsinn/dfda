'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { withUserTransaction } from '@/lib/db'
import { createLogger } from '@/lib/logger'
import { getServerUser } from '@/lib/server-auth'
import { TrackingError } from '@/lib/tracking/errors'
import { recordMeasurement } from '@/lib/tracking/measurements'
import { reopenNotificationsAnsweredBy, respondToNotifications, snoozeNotifications, undoNotifications } from '@/lib/tracking/notifications'

/**
 * The patient inbox's actions (components/inbox), over the tracking layer
 * that the MCP server and /api/v1 use. Each acts on the signed-in person's own
 * data in one transaction with row-level security, all or none, and returns a
 * message to show instead of throwing.
 */

const logger = createLogger('inbox-actions')
const ids = z.array(z.string().uuid()).min(1).max(200)
const value = z.number().finite()
/** How long Snooze hides a notification: one hour, as in QuantiModo. */
const SNOOZE_MS = 3_600_000

export type InboxActionResult = { ok: true; notificationIds: string[] } | { ok: false; error: string }

async function run(name: string, fn: (userId: string) => Promise<string[]>): Promise<InboxActionResult> {
  const user = await getServerUser()
  if (!user) return { ok: false, error: 'Sign in again to continue.' }
  try {
    const notificationIds = await fn(user.id)
    revalidatePath('/patient')
    return { ok: true, notificationIds }
  } catch (error) {
    if (error instanceof TrackingError) return { ok: false, error: error.message }
    if (error instanceof z.ZodError) return { ok: false, error: 'That value could not be saved.' }
    logger.error(`Inbox action ${name} failed`, { userId: user.id, error: error instanceof Error ? error.message : String(error) })
    return { ok: false, error: 'Something went wrong. Try again.' }
  }
}

/** Records `value` for each notification and completes them. */
export async function trackNotificationsAction(notificationIds: string[], recorded: number) {
  return run('track', async (userId) => {
    const input = { notificationIds: ids.parse(notificationIds), action: 'track' as const, value: value.parse(recorded) }
    const result = await withUserTransaction({ id: userId }, (tx) => respondToNotifications(tx, userId, input))
    return result.notifications.map((n) => n.id)
  })
}

export async function skipNotificationsAction(notificationIds: string[]) {
  return run('skip', async (userId) => {
    const input = { notificationIds: ids.parse(notificationIds), action: 'skip' as const }
    const result = await withUserTransaction({ id: userId }, (tx) => respondToNotifications(tx, userId, input))
    return result.notifications.map((n) => n.id)
  })
}

export async function snoozeNotificationsAction(notificationIds: string[]) {
  return run('snooze', async (userId) => {
    const input = { notificationIds: ids.parse(notificationIds), until: new Date(Date.now() + SNOOZE_MS) }
    const result = await withUserTransaction({ id: userId }, (tx) => snoozeNotifications(tx, userId, input))
    return result.notificationIds
  })
}

/** Undoes track, skip or snooze: the notifications are pending again, and a tracked one's measurement is deleted. */
export async function undoNotificationsAction(notificationIds: string[]) {
  return run('undo', async (userId) => {
    const input = { notificationIds: ids.parse(notificationIds) }
    const result = await withUserTransaction({ id: userId }, (tx) => undoNotifications(tx, userId, input))
    return result.notificationIds
  })
}

export async function setFavoriteAction(userVariableId: string, favorite: boolean): Promise<{ ok: true } | { ok: false; error: string }> {
  const result = await run('favorite', async (userId) => {
    const id = z.string().uuid().parse(userVariableId)
    const updated = await withUserTransaction({ id: userId }, (tx) =>
      tx.user_variables.updateMany({ where: { id, user_id: userId, deleted_at: null }, data: { is_favorite: favorite, updated_at: new Date() } }),
    )
    if (updated.count === 0) throw new TrackingError('NOT_FOUND', 'That variable is no longer in your list.')
    return []
  })
  return result.ok ? { ok: true } : result
}

/** Records a favorite's value now, without a reminder. */
export async function recordFavoriteAction(globalVariableId: string, recorded: number): Promise<{ ok: true; measurementId: string } | { ok: false; error: string }> {
  let measurementId = ''
  const result = await run('record-favorite', async (userId) => {
    const input = { globalVariableId: z.string().min(1).parse(globalVariableId), value: value.parse(recorded) }
    measurementId = (await withUserTransaction({ id: userId }, (tx) => recordMeasurement(tx, userId, input))).id
    return []
  })
  return result.ok ? { ok: true, measurementId } : result
}

/**
 * Deletes a measurement recorded from a favorite, for undo. A reminder that the
 * value answered meanwhile (when the inbox refreshed) is due again.
 */
export async function deleteFavoriteRecordAction(measurementId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const result = await run('delete-favorite-record', async (userId) => {
    const id = z.string().uuid().parse(measurementId)
    await withUserTransaction({ id: userId }, async (tx) => {
      await tx.measurements.updateMany({ where: { id, user_id: userId, deleted_at: null }, data: { deleted_at: new Date(), updated_at: new Date() } })
      await reopenNotificationsAnsweredBy(tx, userId, id)
    })
    return []
  })
  return result.ok ? { ok: true } : result
}

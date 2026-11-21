import { zoneOf } from '@/lib/reminders/schedule'
import { decodeCursor, encodeCursor } from '@/lib/tracking/measurements'
import type { TrackingDb } from '@/lib/tracking/variables'

/**
 * The patient app's History (docs/MIGRATION.md, "Patient app modeled on
 * QuantiModo", phase 2): the person's measurements, newest first, by category
 * or for one variable, a page at a time. Runs in the signed-in person's
 * transaction (withUserTransaction).
 */

/** Measurements per page; QuantiModo loaded 50 more at a time. */
export const HISTORY_PAGE_SIZE = 50

export type HistoryFilter = { categoryId?: string; globalVariableId?: string }

export type HistoryItem = {
  id: string
  globalVariableId: string
  name: string
  emoji: string | null
  value: number
  unit: { id: string; abbreviatedName: string }
  startAt: string
  note: string | null
}

export type HistoryPage = { items: HistoryItem[]; nextCursor: string | null }

export async function loadHistory(tx: TrackingDb, userId: string, filter: HistoryFilter, cursor?: string | null): Promise<HistoryPage> {
  const after = cursor ? decodeCursor(cursor) : null
  const rows = await tx.measurements.findMany({
    where: {
      user_id: userId,
      deleted_at: null,
      ...(filter.globalVariableId ? { global_variable_id: filter.globalVariableId } : {}),
      ...(filter.categoryId ? { global_variables: { variable_category_id: filter.categoryId } } : {}),
      ...(after ? { OR: [{ start_at: { lt: after.startAt } }, { start_at: after.startAt, id: { lt: after.id } }] } : {}),
    },
    select: {
      id: true,
      value: true,
      start_at: true,
      notes: true,
      global_variables: { select: { id: true, name: true, emoji: true } },
      units: { select: { id: true, abbreviated_name: true } },
    },
    orderBy: [{ start_at: 'desc' }, { id: 'desc' }],
    take: HISTORY_PAGE_SIZE + 1,
  })
  const page = rows.slice(0, HISTORY_PAGE_SIZE)
  return {
    items: page.map((row) => ({
      id: row.id,
      globalVariableId: row.global_variables.id,
      name: row.global_variables.name,
      emoji: row.global_variables.emoji,
      value: Number(row.value),
      unit: { id: row.units.id, abbreviatedName: row.units.abbreviated_name },
      startAt: row.start_at.toISOString(),
      note: row.notes,
    })),
    nextCursor: rows.length > HISTORY_PAGE_SIZE ? encodeCursor(page[page.length - 1]) : null,
  }
}

export async function historyTimezone(tx: TrackingDb, userId: string): Promise<string> {
  const profile = await tx.profiles.findUnique({ where: { id: userId }, select: { timezone: true } })
  return zoneOf(profile?.timezone)
}

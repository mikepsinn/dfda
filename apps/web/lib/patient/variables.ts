import { DateTime } from 'luxon'
import type { Prisma } from '@/lib/db'
import { presetValues } from '@/lib/inbox/view'
import { zoneOf } from '@/lib/reminders/schedule'
import type { TrackingDb } from '@/lib/tracking/variables'

/**
 * Server reads for the patient app's variable search and recording form
 * (docs/MIGRATION.md, "Patient app modeled on QuantiModo", phase 2). They run
 * in the signed-in person's transaction (withUserTransaction), so row-level
 * security limits them to the person's own rows.
 */

export type VariableCategory = { id: string; name: string }

export async function listCategories(tx: TrackingDb): Promise<VariableCategory[]> {
  return tx.variable_categories.findMany({
    select: { id: true, name: true },
    orderBy: [{ display_order: 'asc' }, { name: 'asc' }],
  })
}

export type VariableSearchResult = {
  globalVariableId: string
  name: string
  emoji: string | null
  category: string
  /** The person's own measurements of the variable, when they have any. */
  recorded: { count: number; latestAt: string } | null
}

/** How many results the search shows. */
const SEARCH_LIMIT = 30

function nameMatches(query: string): Prisma.global_variablesWhereInput {
  if (!query) return {}
  return {
    OR: [
      { name: { contains: query, mode: 'insensitive' } },
      { global_variable_synonyms: { some: { name: { contains: query, mode: 'insensitive' } } } },
    ],
  }
}

const resultSelect = { id: true, name: true, emoji: true, variable_categories: { select: { name: true } } } as const

/**
 * The variables the search offers, as in QuantiModo: the person's own first,
 * most recently recorded first, then other matching variables by name.
 * Without a query it offers only the person's own.
 */
export async function findVariables(
  tx: TrackingDb,
  userId: string,
  input: { query?: string; categoryId?: string },
): Promise<VariableSearchResult[]> {
  const query = input.query?.trim() ?? ''
  const variableWhere: Prisma.global_variablesWhereInput = {
    deleted_at: null,
    ...(input.categoryId ? { variable_category_id: input.categoryId } : {}),
    ...nameMatches(query),
  }
  const own = await tx.user_variables.findMany({
    where: { user_id: userId, deleted_at: null, global_variables: variableWhere },
    select: { global_variables: { select: resultSelect } },
  })
  const ownIds = own.map((row) => row.global_variables.id)
  const stats = ownIds.length
    ? await tx.measurements.groupBy({
        by: ['global_variable_id'],
        where: { user_id: userId, deleted_at: null, global_variable_id: { in: ownIds } },
        _count: { _all: true },
        _max: { start_at: true },
      })
    : []
  const recorded = new Map(
    stats.map((row) => [row.global_variable_id, { count: row._count._all, latestAt: row._max.start_at?.toISOString() ?? '' }]),
  )
  const toResult = (row: { id: string; name: string; emoji: string | null; variable_categories: { name: string } }) => ({
    globalVariableId: row.id,
    name: row.name,
    emoji: row.emoji,
    category: row.variable_categories.name,
    recorded: recorded.get(row.id) ?? null,
  })
  const ownResults = own
    .map((row) => toResult(row.global_variables))
    .sort((a, b) => (b.recorded?.latestAt ?? '').localeCompare(a.recorded?.latestAt ?? '') || a.name.localeCompare(b.name))
    .slice(0, SEARCH_LIMIT)
  if (!query || ownResults.length >= SEARCH_LIMIT) return ownResults
  const others = await tx.global_variables.findMany({
    where: { ...variableWhere, id: { notIn: ownIds } },
    select: resultSelect,
    orderBy: { name: 'asc' },
    take: SEARCH_LIMIT - ownResults.length,
  })
  return [...ownResults, ...others.map(toResult)]
}

export type FormUnit = { id: string; abbreviatedName: string; name: string }

/** What the recording form needs for one variable. */
export type RecordingVariable = {
  globalVariableId: string
  userVariableId: string | null
  name: string
  emoji: string | null
  category: string
  /** The unit to record in: the person's preferred unit, else the variable's. */
  unitId: string
  /** Units the value can be recorded in: the variable's, the preferred one, and others of the same kind. */
  units: FormUnit[]
  /** True when a higher rating is worse (symptoms). */
  higherIsWorse: boolean
  defaultValue: number | null
  presets: number[]
  /** The person's time zone, in which the form shows dates and times. */
  timezone: string
}

const unitSelect = { id: true, name: true, abbreviated_name: true, unit_category_id: true } as const
const toFormUnit = (unit: { id: string; name: string; abbreviated_name: string }): FormUnit => ({
  id: unit.id,
  abbreviatedName: unit.abbreviated_name,
  name: unit.name,
})

/** The recording form's variable, or null when there is no such variable. */
export async function loadRecordingVariable(tx: TrackingDb, userId: string, globalVariableId: string): Promise<RecordingVariable | null> {
  const [variable, userVariable, profile] = await Promise.all([
    tx.global_variables.findFirst({
      where: { id: globalVariableId, deleted_at: null },
      select: {
        id: true,
        name: true,
        emoji: true,
        variable_categories: { select: { name: true } },
        units: { select: unitSelect },
        global_symptoms: { select: { id: true } },
      },
    }),
    tx.user_variables.findFirst({
      where: { user_id: userId, global_variable_id: globalVariableId, deleted_at: null },
      select: {
        id: true,
        units: { select: unitSelect },
        reminder_schedules: { where: { is_active: true, default_value: { not: null } }, select: { default_value: true }, take: 1 },
      },
    }),
    tx.profiles.findUnique({ where: { id: userId }, select: { timezone: true } }),
  ])
  if (!variable) return null
  const defaultUnit = variable.units
  const preferred = userVariable?.units ?? null
  const unit = preferred ?? defaultUnit
  // A dimensionless unit (a rating, yes/no) converts to no other unit (resolveUnit in lib/tracking/variables).
  const sameKind =
    defaultUnit.unit_category_id === 'dimensionless'
      ? []
      : await tx.units.findMany({ where: { unit_category_id: defaultUnit.unit_category_id }, select: unitSelect, orderBy: { name: 'asc' } })
  const units = [unit, defaultUnit, ...sameKind].filter((u, i, all) => all.findIndex((other) => other.id === u.id) === i)
  const recent = await tx.measurements.findMany({
    where: { user_id: userId, deleted_at: null, global_variable_id: globalVariableId, unit_id: unit.id },
    orderBy: { start_at: 'desc' },
    take: 50,
    select: { value: true },
  })
  const defaultValue = userVariable?.reminder_schedules[0]?.default_value ?? null
  return {
    globalVariableId: variable.id,
    userVariableId: userVariable?.id ?? null,
    name: variable.name,
    emoji: variable.emoji,
    category: variable.variable_categories.name,
    unitId: unit.id,
    units: units.map(toFormUnit),
    higherIsWorse: variable.global_symptoms !== null,
    defaultValue,
    presets: presetValues(defaultValue, recent.map((m) => Number(m.value))),
    timezone: zoneOf(profile?.timezone),
  }
}

/** A recorded value to change on the form. */
export type EditableMeasurement = {
  id: string
  value: number
  unitId: string
  /** Local date (YYYY-MM-DD) and time (HH:mm) in the person's time zone. */
  date: string
  time: string
  note: string
}

export async function loadEditableMeasurement(
  tx: TrackingDb,
  userId: string,
  measurementId: string,
): Promise<{ measurement: EditableMeasurement; variable: RecordingVariable } | null> {
  const row = await tx.measurements.findFirst({
    where: { id: measurementId, user_id: userId, deleted_at: null },
    select: { id: true, value: true, unit_id: true, start_at: true, notes: true, global_variable_id: true },
  })
  if (!row) return null
  const variable = await loadRecordingVariable(tx, userId, row.global_variable_id)
  if (!variable) return null
  // The value's own unit stays selectable, also if it is no longer one of the variable's.
  if (!variable.units.some((unit) => unit.id === row.unit_id)) {
    const unit = await tx.units.findUnique({ where: { id: row.unit_id }, select: unitSelect })
    if (unit) variable.units.unshift(toFormUnit(unit))
  }
  const local = DateTime.fromJSDate(row.start_at).setZone(variable.timezone)
  return {
    measurement: {
      id: row.id,
      value: Number(row.value),
      unitId: row.unit_id,
      date: local.toISODate()!,
      time: local.toFormat('HH:mm'),
      note: row.notes ?? '',
    },
    variable,
  }
}

/** A local date and time in `zone` as an ISO instant, or null when they are not valid. */
export function localToInstant(date: string, time: string, zone: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return null
  const at = DateTime.fromISO(`${date}T${time}`, { zone })
  return at.isValid ? at.toUTC().toISO() : null
}

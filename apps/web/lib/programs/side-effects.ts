import { adminDb, dbAs, withUserTransaction, type DbUser, type Prisma } from '@/lib/db'
import { logger } from '@/lib/logger'
import { recordMeasurement } from '@/lib/tracking/measurements'
import { afterReminderSaved, upsertReminder } from '@/lib/tracking/reminders'
import { SCALE_RANGES } from './config'
import type { Program, ProgramItem } from './data'
import { CHECK_IN_REMINDER_TIME, dayTime, itemValue, ProgramError } from './manage'

/**
 * Side effects: symptoms that a person rates on a scale, such as headache or
 * dizziness, beside their programs' own check-ins. Nothing about them is
 * stored per program. A person tracks a symptom with a normal reminder for it
 * (their reminders page shows it too), and its ratings are their normal
 * measurements. So the daily check-in of each of their programs asks for each
 * symptom that has an active reminder and is not a check-in of one of their
 * programs, and the care team of a program with care team review sees the
 * symptoms that the person rated. A treatment's side effects page shows the
 * symptoms that the person rated since they started the treatment. Server only.
 */

/** The variable categories of symptoms. */
const SYMPTOM_CATEGORIES = ['health-and-physiology', 'mental-and-emotional-state']

/** A variable that can be a side effect: a symptom rated on a scale. */
export const symptomWhere = {
  deleted_at: null,
  variable_category_id: { in: SYMPTOM_CATEGORIES },
  default_unit_id: { in: Object.keys(SCALE_RANGES) },
} satisfies Prisma.global_variablesWhereInput

const variableSelect = {
  id: true,
  name: true,
  default_unit_id: true,
  units: { select: { abbreviated_name: true } },
} satisfies Prisma.global_variablesSelect

type VariableRow = Prisma.global_variablesGetPayload<{ select: typeof variableSelect }>

/** A symptom that a member can add, with its rating scale and other names. */
export type SideEffectOption = { id: string; name: string; scale: [min: number, max: number]; synonyms: string[] }

/** The id of a side effect's field in the check-in form. */
export function sideEffectItemId(variableId: string): string {
  return `side-effect-${variableId}`
}

/** A side effect as a daily check-in where lower is better. */
function toItem(variable: VariableRow): ProgramItem {
  return {
    id: sideEffectItemId(variable.id),
    kind: 'check_in',
    variableId: variable.id,
    name: variable.name,
    unitId: variable.default_unit_id,
    unit: variable.units.abbreviated_name,
    molarMass: null,
    frequency: 'daily',
    better: 'lower',
    defaultValue: null,
  }
}

type Db = Pick<Prisma.TransactionClient, 'reminder_schedules' | 'program_enrollments'>

/** The variables of the items of each user's programs, by user id. */
async function programVariables(db: Db, userIds: string[]): Promise<Map<string, Set<string>>> {
  const rows = await db.program_enrollments.findMany({
    where: { user_id: { in: userIds } },
    select: { user_id: true, instance_programs: { select: { instance_program_items: { select: { global_variable_id: true } } } } },
  })
  const byUser = new Map<string, Set<string>>()
  for (const row of rows) {
    const ids = byUser.get(row.user_id) ?? new Set<string>()
    for (const item of row.instance_programs.instance_program_items) ids.add(item.global_variable_id)
    byUser.set(row.user_id, ids)
  }
  return byUser
}

/** The symptoms that `user` can add as side effects: those that are not items of their programs. */
export async function sideEffectOptions(user: DbUser): Promise<SideEffectOption[]> {
  const own = await withUserTransaction(user, (tx) => programVariables(tx, [user.id]))
  const rows = await dbAs(null).global_variables.findMany({
    where: { ...symptomWhere, id: { notIn: [...(own.get(user.id) ?? [])] } },
    select: { id: true, name: true, default_unit_id: true, global_variable_synonyms: { select: { name: true } } },
    orderBy: { name: 'asc' },
    take: 500,
  })
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    scale: SCALE_RANGES[row.default_unit_id],
    synonyms: row.global_variable_synonyms
      .map((synonym) => synonym.name)
      .filter((name) => name.toLowerCase() !== row.name.toLowerCase()),
  }))
}

/** A reminder that tracks a symptom: active, and not ended. */
const trackingWhere = (now: Date) =>
  ({ is_active: true, OR: [{ end_date: null }, { end_date: { gte: now } }] }) satisfies Prisma.reminder_schedulesWhereInput

/**
 * The side effects of each user, by user id: the symptoms with a reminder that
 * tracks them, in the order of their first reminder, except the items of their
 * programs. `db` is a transaction of the user for their pages, or the admin
 * client for the check-in emails.
 */
export async function sideEffectsOf(db: Db, userIds: string[], now = new Date()): Promise<Map<string, ProgramItem[]>> {
  const own = await programVariables(db, userIds)
  const rows = await db.reminder_schedules.findMany({
    where: {
      ...trackingWhere(now),
      user_id: { in: userIds },
      user_variables: { deleted_at: null, global_variables: symptomWhere },
    },
    select: { user_id: true, user_variables: { select: { global_variables: { select: variableSelect } } } },
    orderBy: [{ created_at: 'asc' }, { id: 'asc' }],
  })
  const byUser = new Map<string, ProgramItem[]>()
  for (const row of rows) {
    const items = byUser.get(row.user_id) ?? []
    const variable = row.user_variables.global_variables
    if (own.get(row.user_id)?.has(variable.id) || items.some((item) => item.variableId === variable.id)) continue
    byUser.set(row.user_id, [...items, toItem(variable)])
  }
  return byUser
}

/** The side effects that `user` tracks. */
export async function mySideEffects(user: DbUser): Promise<ProgramItem[]> {
  const sideEffects = await withUserTransaction(user, (tx) => sideEffectsOf(tx, [user.id]))
  return sideEffects.get(user.id) ?? []
}

/**
 * The side effects of `program` that a person rated since `since`, for the
 * program's care team (lib/care-team/data.ts): read with the admin client,
 * after the care team and the sharing are checked.
 */
export async function ratedSideEffects(userId: string, program: Pick<Program, 'items'>, since: Date): Promise<ProgramItem[]> {
  const rows = await adminDb.global_variables.findMany({
    where: {
      ...symptomWhere,
      id: { notIn: program.items.map((item) => item.variableId) },
      measurements: { some: { user_id: userId, deleted_at: null, start_at: { gte: since } } },
    },
    select: variableSelect,
    orderBy: { name: 'asc' },
  })
  return rows.map(toItem)
}

/**
 * Starts to track a symptom: a daily reminder at the check-in time, when the
 * user has no reminder that tracks it, and the rating of `date` when they gave
 * one. From a program's pages the user must be a member of `program`; a
 * treatment's page gives no program.
 */
export async function addSideEffect(
  user: DbUser,
  program: Pick<Program, 'id'> | null,
  input: { variableId: string; value: string; date: string },
) {
  const startTime = dayTime(input.date)
  const result = await withUserTransaction(user, async (tx) => {
    if (program) {
      const enrollment = await tx.program_enrollments.findUnique({
        where: { program_id_user_id: { program_id: program.id, user_id: user.id } },
        select: { id: true },
      })
      if (!enrollment) throw new ProgramError('Join the program first.')
    }
    const variable = await tx.global_variables.findFirst({ where: { ...symptomWhere, id: input.variableId }, select: variableSelect })
    if (!variable || (await programVariables(tx, [user.id])).get(user.id)?.has(variable.id)) {
      throw new ProgramError('Choose a side effect from the list.')
    }
    const item = toItem(variable)
    const value = input.value.trim() ? itemValue(item, input.value) : null

    if (value !== null) {
      await recordMeasurement(tx, user.id, { globalVariableId: variable.id, value, unitId: item.unitId, startTime })
    }
    const tracking = await tx.reminder_schedules.findFirst({
      where: { ...trackingWhere(new Date()), user_id: user.id, user_variables: { global_variable_id: variable.id } },
      select: { id: true },
    })
    if (tracking) return { item, reminder: null }
    const { reminder } = await upsertReminder(tx, user.id, {
      globalVariableId: variable.id,
      timeOfDay: CHECK_IN_REMINDER_TIME,
      rrule: 'FREQ=DAILY',
    })
    return { item, reminder: { id: reminder.id, isActive: reminder.isActive } }
  })

  // After the commit, as in joinProgram: the worker makes the reminder's first notification.
  if (result.reminder) {
    try {
      await afterReminderSaved(user.id, result.reminder, true)
    } catch (error) {
      logger.warn('Could not schedule the first notification of a side effect reminder', {
        reminderId: result.reminder.id,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }
  return result.item
}

/** A symptom that a person rated, with their ratings, the newest first. */
export type RatedSymptom = { item: ProgramItem; ratings: { value: number; unit: string; at: Date }[] }

/**
 * The symptoms that `user` rated since `since`, each with its ratings, the
 * newest first, for the side effects page of a treatment that they started
 * then. The check-ins of their programs are symptoms too, so they are in it.
 */
export async function mySymptomRatings(user: DbUser, since: Date): Promise<RatedSymptom[]> {
  const rows = await withUserTransaction(user, (tx) =>
    tx.measurements.findMany({
      where: { user_id: user.id, deleted_at: null, start_at: { gte: since }, global_variables: symptomWhere },
      select: { value: true, start_at: true, units: { select: { abbreviated_name: true } }, global_variables: { select: variableSelect } },
      orderBy: [{ start_at: 'desc' }, { id: 'asc' }],
    }),
  )
  const byVariable = new Map<string, RatedSymptom>()
  for (const row of rows) {
    const symptom = byVariable.get(row.global_variables.id) ?? { item: toItem(row.global_variables), ratings: [] }
    symptom.ratings.push({ value: row.value, unit: row.units.abbreviated_name, at: row.start_at })
    byVariable.set(row.global_variables.id, symptom)
  }
  return [...byVariable.values()].sort((a, b) => a.item.name.localeCompare(b.item.name))
}

/**
 * Stops tracking a side effect: deletes the user's reminders for it. Its
 * ratings stay. Not for an item of one of their programs, whose reminder the
 * program uses.
 */
export async function removeSideEffect(user: DbUser, variableId: string) {
  return withUserTransaction(user, async (tx) => {
    if ((await programVariables(tx, [user.id])).get(user.id)?.has(variableId)) return false
    const { count } = await tx.reminder_schedules.deleteMany({
      where: { user_id: user.id, user_variables: { global_variable_id: variableId, global_variables: symptomWhere } },
    })
    return count > 0
  })
}

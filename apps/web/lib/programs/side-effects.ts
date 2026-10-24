import { adminDb, dbAs, withUserTransaction, type DbUser, type Prisma } from '@/lib/db'
import { logger } from '@/lib/logger'
import { recordMeasurement } from '@/lib/tracking/measurements'
import { afterReminderSaved, upsertReminder } from '@/lib/tracking/reminders'
import { ensureUserVariable } from '@/lib/tracking/variables'
import { SCALE_RANGES } from './config'
import type { Program, ProgramItem } from './data'
import { CHECK_IN_REMINDER_TIME, dayTime, itemValue, ProgramError } from './manage'

/**
 * The side effects that a member tracks in a program, beside the program's
 * own check-ins: symptoms from the variables catalog that are rated on a
 * scale, such as headache or dizziness. The member's daily check-in asks for
 * each one, and the care team sees them with the other logs. Server only.
 */

/** The variable categories of symptoms. */
const SYMPTOM_CATEGORIES = ['health-and-physiology', 'mental-and-emotional-state']

/** A variable that can be a side effect: a symptom rated on a scale. */
const symptomWhere = {
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

/** The symptoms that a member can add as side effects in `program`: those that are not items of the program. */
export async function sideEffectOptions(program: Pick<Program, 'items'>): Promise<SideEffectOption[]> {
  const rows = await dbAs(null).global_variables.findMany({
    where: { ...symptomWhere, id: { notIn: program.items.map((item) => item.variableId) } },
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

const sideEffectRows = {
  select: { global_variables: { select: variableSelect } },
  orderBy: { created_at: 'asc' },
} satisfies Prisma.enrollment_side_effectsFindManyArgs

/** The side effects that `user` tracks in a program, in the order they added them; empty when they are not in it. */
export async function mySideEffects(user: DbUser, programId: string): Promise<ProgramItem[]> {
  const rows = await dbAs(user).enrollment_side_effects.findMany({
    where: { program_enrollments: { program_id: programId, user_id: user.id } },
    ...sideEffectRows,
  })
  return rows.map((row) => toItem(row.global_variables))
}

/**
 * The side effects of enrollments, by enrollment id, read on the server: for the care team
 * after it checks the care team and the sharing (lib/care-team/data.ts), and
 * for the check-in emails and their page (lib/programs/check-in.ts).
 */
export async function enrollmentSideEffects(enrollmentIds: string[]): Promise<Map<string, ProgramItem[]>> {
  const rows = await adminDb.enrollment_side_effects.findMany({
    where: { enrollment_id: { in: enrollmentIds } },
    select: { enrollment_id: true, ...sideEffectRows.select },
    orderBy: sideEffectRows.orderBy,
  })
  const byEnrollment = new Map<string, ProgramItem[]>()
  for (const row of rows) byEnrollment.set(row.enrollment_id, [...(byEnrollment.get(row.enrollment_id) ?? []), toItem(row.global_variables)])
  return byEnrollment
}

/**
 * Adds a side effect to the user's enrollment in `program`. With a `value`,
 * also records the rating of `date`. With `remind`, also adds a daily
 * reminder at the check-in time, when the user has no active reminder for
 * the symptom. Adding a side effect that is already there records the value
 * only.
 */
export async function addSideEffect(
  user: DbUser,
  program: Program,
  input: { variableId: string; value: string; date: string; remind: boolean },
) {
  const startTime = dayTime(input.date)
  const result = await withUserTransaction(user, async (tx) => {
    const enrollment = await tx.program_enrollments.findUnique({
      where: { program_id_user_id: { program_id: program.id, user_id: user.id } },
      select: { id: true },
    })
    if (!enrollment) throw new ProgramError('Join the program first.')
    const variable = await tx.global_variables.findFirst({ where: { ...symptomWhere, id: input.variableId }, select: variableSelect })
    if (!variable || program.items.some((item) => item.variableId === variable.id)) {
      throw new ProgramError('Choose a side effect from the list.')
    }
    const item = toItem(variable)
    const value = input.value.trim() ? itemValue(item, input.value) : null

    await tx.enrollment_side_effects.upsert({
      where: { enrollment_id_global_variable_id: { enrollment_id: enrollment.id, global_variable_id: variable.id } },
      create: { enrollment_id: enrollment.id, global_variable_id: variable.id },
      update: {},
      select: { enrollment_id: true },
    })
    if (value !== null) {
      await recordMeasurement(tx, user.id, { globalVariableId: variable.id, value, unitId: item.unitId, startTime })
    }
    if (!input.remind) return { item, reminder: null }
    const userVariable = await ensureUserVariable(tx, user.id, variable.id)
    const active = await tx.reminder_schedules.findFirst({
      where: { user_id: user.id, user_variable_id: userVariable.id, is_active: true },
      select: { id: true },
    })
    if (active) return { item, reminder: null }
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
  return { item: result.item, reminderAdded: result.reminder !== null }
}

/** Stops tracking a side effect in a program. Its values and reminders stay the user's. */
export async function removeSideEffect(user: DbUser, programId: string, variableId: string) {
  const { count } = await dbAs(user).enrollment_side_effects.deleteMany({
    where: { global_variable_id: variableId, program_enrollments: { program_id: programId, user_id: user.id } },
  })
  return count > 0
}

import { adminDb, dbAs, withUserTransaction, type DbUser, type Prisma } from '@/lib/db'
import { logger } from '@/lib/logger'
import { recordMeasurement } from '@/lib/tracking/measurements'
import { afterReminderSaved, upsertReminder } from '@/lib/tracking/reminders'
import { ensureUserVariable } from '@/lib/tracking/variables'
import { SCALE_RANGES } from './config'
import type { Program, ProgramItem } from './data'
import { CHECK_IN_REMINDER_TIME, dayTime, itemValue, ProgramError } from './manage'

/**
 * Symptoms that a person rates on a scale, such as headache or dizziness: the
 * side effects of a program or a treatment, and the symptoms of a condition.
 * A symptom is a catalog variable that global_symptoms marks, so that the
 * same symptom counts across people. A person tracks a symptom with a normal
 * reminder for it (their reminders page shows it too), and its ratings are
 * their normal measurements. A link says why: patient_side_effects links a
 * symptom to one of their treatments, and patient_symptoms to one of their
 * conditions. The ratings say how bad, over time.
 *
 * So the daily check-in of each of their programs asks for each symptom that
 * has an active reminder and is not a check-in of one of their programs, and
 * the care team of a program with care team review sees the symptoms that the
 * person rated. Server only.
 */

/** A symptom: a variable that global_symptoms marks, rated on a scale. */
export const symptomWhere = {
  deleted_at: null,
  default_unit_id: { in: Object.keys(SCALE_RANGES) },
  global_symptoms: { is: { deleted_at: null } },
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

async function optionsExcept(excluded: Iterable<string>): Promise<SideEffectOption[]> {
  const rows = await dbAs(null).global_variables.findMany({
    where: { ...symptomWhere, id: { notIn: [...excluded] } },
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

/** The symptoms that `user` can add as side effects of a program: those that are not items of their programs. */
export async function sideEffectOptions(user: DbUser): Promise<SideEffectOption[]> {
  const own = await withUserTransaction(user, (tx) => programVariables(tx, [user.id]))
  return optionsExcept(own.get(user.id) ?? [])
}

/**
 * All the symptoms, for the side effects of a treatment and the symptoms of a
 * condition: a check-in of a program (such as nausea) can be either.
 */
export function symptomOptions(): Promise<SideEffectOption[]> {
  return optionsExcept([])
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
 * Where a person adds a symptom: a program's pages (a side effect, for a
 * member), one of their treatments (a side effect that they think it causes)
 * or one of their conditions (a symptom of it).
 */
export type SymptomTarget = { program: Pick<Program, 'id'> } | { patientTreatmentId: string } | { patientConditionId: string }

/**
 * Starts to track a symptom: a daily reminder at the check-in time, when the
 * user has no reminder that tracks it, and the rating of `date` when they gave
 * one. For a treatment or a condition, it also links the symptom to it.
 */
export async function trackSymptom(user: DbUser, target: SymptomTarget, input: { variableId: string; value: string; date: string }) {
  const startTime = dayTime(input.date)
  const result = await withUserTransaction(user, async (tx) => {
    if ('program' in target) {
      const enrollment = await tx.program_enrollments.findUnique({
        where: { program_id_user_id: { program_id: target.program.id, user_id: user.id } },
        select: { id: true },
      })
      if (!enrollment) throw new ProgramError('Join the program first.')
    } else if ('patientTreatmentId' in target) {
      const treatment = await tx.patient_treatments.findFirst({ where: { id: target.patientTreatmentId, patient_id: user.id }, select: { id: true } })
      if (!treatment) throw new ProgramError('This treatment is not in your list.')
    } else {
      const condition = await tx.patient_conditions.findFirst({
        where: { id: target.patientConditionId, patient_id: user.id, deleted_at: null },
        select: { id: true },
      })
      if (!condition) throw new ProgramError('This condition is not in your list.')
    }
    const variable = await tx.global_variables.findFirst({ where: { ...symptomWhere, id: input.variableId }, select: variableSelect })
    // In a program, its own check-ins are not side effects; a treatment or a condition can have them.
    if (!variable || ('program' in target && (await programVariables(tx, [user.id])).get(user.id)?.has(variable.id))) {
      throw new ProgramError(`Choose a ${'patientConditionId' in target ? 'symptom' : 'side effect'} from the list.`)
    }
    const item = toItem(variable)
    const value = input.value.trim() ? itemValue(item, input.value) : null

    if (value !== null) {
      await recordMeasurement(tx, user.id, { globalVariableId: variable.id, value, unitId: item.unitId, startTime })
    }
    if ('patientTreatmentId' in target) {
      await tx.patient_side_effects.createMany({
        data: [{ patient_treatment_id: target.patientTreatmentId, symptom_id: variable.id }],
        skipDuplicates: true,
      })
    } else if ('patientConditionId' in target) {
      const userVariable = await ensureUserVariable(tx, user.id, variable.id)
      await tx.patient_symptoms.createMany({
        data: [{ patient_id: user.id, patient_condition_id: target.patientConditionId, symptom_id: variable.id, user_variable_id: userVariable.id }],
        skipDuplicates: true,
      })
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
      logger.warn('Could not schedule the first notification of a symptom reminder', {
        reminderId: result.reminder.id,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }
  return result.item
}

/** Starts to track a side effect for a member of `program` (trackSymptom). */
export function addSideEffect(user: DbUser, program: Pick<Program, 'id'>, input: { variableId: string; value: string; date: string }) {
  return trackSymptom(user, { program }, input)
}

/** A symptom with the person's ratings of it, the newest first. */
export type RatedSymptom = { item: ProgramItem; ratings: { value: number; unit: string; at: Date }[] }

/**
 * The start of the day of `at` (UTC). The rating of a whole day is saved at
 * noon UTC (dayTime), so a treatment started in the afternoon keeps that
 * day's rating.
 */
function dayStart(at: Date): Date {
  return new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate()))
}

type RatingsDb = Pick<Prisma.TransactionClient, 'measurements'>

/** `variables` with the user's ratings of each, from the day of `since` when given, sorted by name. */
async function withRatings(db: RatingsDb, userId: string, variables: VariableRow[], since: Date | null): Promise<RatedSymptom[]> {
  const rows = await db.measurements.findMany({
    where: {
      user_id: userId,
      deleted_at: null,
      global_variable_id: { in: variables.map((variable) => variable.id) },
      ...(since ? { start_at: { gte: dayStart(since) } } : {}),
    },
    select: { global_variable_id: true, value: true, start_at: true, units: { select: { abbreviated_name: true } } },
    orderBy: [{ start_at: 'desc' }, { id: 'asc' }],
  })
  return variables
    .map((variable) => ({
      item: toItem(variable),
      ratings: rows
        .filter((row) => row.global_variable_id === variable.id)
        .map((row) => ({ value: row.value, unit: row.units.abbreviated_name, at: row.start_at })),
    }))
    .sort((a, b) => a.item.name.localeCompare(b.item.name))
}

/** The side effects that `user` links to one of their treatments, with their ratings from the day that it started. */
export async function treatmentSideEffects(user: DbUser, patientTreatmentId: string, startedAt: Date): Promise<RatedSymptom[]> {
  return withUserTransaction(user, async (tx) => {
    const rows = await tx.patient_side_effects.findMany({
      where: { patient_treatment_id: patientTreatmentId, deleted_at: null, patient_treatments: { patient_id: user.id } },
      select: { global_symptoms: { select: { global_variables: { select: variableSelect } } } },
    })
    const variables = rows.flatMap((row) => (row.global_symptoms ? [row.global_symptoms.global_variables] : []))
    return withRatings(tx, user.id, variables, startedAt)
  })
}

/** The symptoms that `user` links to one of their conditions, with all their ratings. */
export async function conditionSymptoms(user: DbUser, patientConditionId: string): Promise<RatedSymptom[]> {
  return withUserTransaction(user, async (tx) => {
    const rows = await tx.patient_symptoms.findMany({
      where: { patient_condition_id: patientConditionId, patient_id: user.id, deleted_at: null },
      select: { global_symptoms: { select: { global_variables: { select: variableSelect } } } },
    })
    return withRatings(
      tx,
      user.id,
      rows.map((row) => row.global_symptoms.global_variables),
      null,
    )
  })
}

/**
 * The symptoms that `user` rated from the day of `since` (UTC), each with its
 * ratings, the newest first: on a treatment's page, the symptoms that they
 * rated since they started it and may add as its side effects.
 */
export async function mySymptomRatings(user: DbUser, since: Date): Promise<RatedSymptom[]> {
  return withUserTransaction(user, async (tx) => {
    const variables = await tx.global_variables.findMany({
      where: { ...symptomWhere, measurements: { some: { user_id: user.id, deleted_at: null, start_at: { gte: dayStart(since) } } } },
      select: variableSelect,
    })
    return withRatings(tx, user.id, variables, since)
  })
}

/**
 * Removes the link of a symptom to one of the user's treatments or conditions.
 * Its ratings and its reminder stay: another treatment, a condition or a
 * program can use them, and the reminders page stops the reminder.
 */
export async function unlinkSymptom(
  user: DbUser,
  target: { patientTreatmentId: string } | { patientConditionId: string },
  variableId: string,
): Promise<boolean> {
  return withUserTransaction(user, async (tx) => {
    const { count } =
      'patientTreatmentId' in target
        ? await tx.patient_side_effects.deleteMany({
            where: { patient_treatment_id: target.patientTreatmentId, symptom_id: variableId, patient_treatments: { patient_id: user.id } },
          })
        : await tx.patient_symptoms.deleteMany({
            where: { patient_condition_id: target.patientConditionId, symptom_id: variableId, patient_id: user.id },
          })
    return count > 0
  })
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

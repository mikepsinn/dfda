import { logger } from '@/lib/logger'
import { dbAs, withUserTransaction, type DbUser } from '@/lib/db'
import { afterReminderSaved, upsertReminder } from '@/lib/tracking/reminders'
import { recordMeasurement } from '@/lib/tracking/measurements'
import { ensureUserVariable } from '@/lib/tracking/variables'
import { SCALE_RANGES, type ProgramInput } from './config'
import type { Program } from './data'

/** Saves, joins and records values of programs, with the user's own permissions. Server only. */

export class ProgramError extends Error {
  constructor(message: string, readonly field?: 'slug' | 'items') {
    super(message)
  }
}

/**
 * Creates a program on an instance of `user`, or changes the program
 * `currentSlug`. Changing it replaces its items; people who already joined
 * keep their reminders.
 */
export async function saveProgram(user: DbUser, instanceSlug: string, input: ProgramInput, currentSlug?: string) {
  return withUserTransaction(user, async (tx) => {
    const instance = await tx.instances.findFirst({ where: { slug: instanceSlug, owner_id: user.id }, select: { id: true } })
    if (!instance) throw new ProgramError('This instance does not exist, or it is not yours.')

    const variableIds = input.items.map((item) => item.variableId)
    const known = await tx.global_variables.count({ where: { id: { in: variableIds }, deleted_at: null } })
    if (known !== variableIds.length) throw new ProgramError('Choose each variable from the list.', 'items')

    const data = {
      slug: input.slug,
      name: input.name,
      summary: input.summary,
      follow_up_weeks: input.followUpWeeks,
      updated_at: new Date(),
    }
    let programId: string
    if (currentSlug) {
      const existing = await tx.instance_programs.findFirst({
        where: { instance_id: instance.id, slug: currentSlug },
        select: { id: true },
      })
      if (!existing) throw new ProgramError('This program does not exist.')
      await tx.instance_programs.update({ where: { id: existing.id }, data, select: { id: true } })
      await tx.instance_program_items.deleteMany({ where: { program_id: existing.id } })
      programId = existing.id
    } else {
      programId = (await tx.instance_programs.create({ data: { ...data, instance_id: instance.id }, select: { id: true } })).id
    }

    await tx.instance_program_items.createMany({
      data: input.items.map((item, position) => ({
        program_id: programId,
        kind: item.kind,
        global_variable_id: item.variableId,
        frequency: item.kind === 'lab' ? null : item.frequency,
        better: item.kind === 'dose' ? null : item.better,
        default_value: item.kind === 'dose' ? item.defaultValue : null,
        position,
      })),
    })
    return { id: programId, slug: input.slug }
  })
}

/** Local times of the reminders a program creates; people can change them on their reminders page. */
export const DOSE_REMINDER_TIME = '09:00'
export const CHECK_IN_REMINDER_TIME = '20:00'

/**
 * Joins `program`: records the start and creates a reminder for each dose and
 * check-in that the user does not already have a reminder for. A user with no
 * role becomes a patient, because they now track their own health.
 */
export async function joinProgram(user: DbUser, program: Program) {
  const result = await withUserTransaction(user, async (tx) => {
    const existing = await tx.program_enrollments.findUnique({
      where: { program_id_user_id: { program_id: program.id, user_id: user.id } },
      select: { id: true },
    })
    if (existing) return { joined: false, reminders: [] as { id: string; isActive: boolean }[] }

    await tx.program_enrollments.create({ data: { program_id: program.id, user_id: user.id }, select: { id: true } })
    await tx.profiles.updateMany({ where: { id: user.id, user_type: null }, data: { user_type: 'patient' } })

    const reminders: { id: string; isActive: boolean }[] = []
    for (const item of program.items) {
      if (item.kind === 'lab') continue
      const userVariable = await ensureUserVariable(tx, user.id, item.variableId)
      const active = await tx.reminder_schedules.findFirst({
        where: { user_id: user.id, user_variable_id: userVariable.id, is_active: true },
        select: { id: true },
      })
      if (active) continue
      const { reminder } = await upsertReminder(tx, user.id, {
        globalVariableId: item.variableId,
        timeOfDay: item.kind === 'dose' ? DOSE_REMINDER_TIME : CHECK_IN_REMINDER_TIME,
        rrule: item.frequency === 'weekly' ? 'FREQ=WEEKLY' : 'FREQ=DAILY',
        defaultValue: item.defaultValue,
      })
      reminders.push({ id: reminder.id, isActive: reminder.isActive })
    }
    return { joined: true, reminders }
  })

  // After the commit: the worker makes each reminder's first notification.
  for (const reminder of result.reminders) {
    try {
      await afterReminderSaved(user.id, reminder, true)
    } catch (error) {
      logger.warn('Could not schedule the first notification of a program reminder', {
        reminderId: reminder.id,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }
  return result
}

/** Leaves a program. The company totals no longer include the user; their own records stay theirs. */
export async function leaveProgram(user: DbUser, programId: string) {
  const { count } = await dbAs(user).program_enrollments.deleteMany({ where: { program_id: programId, user_id: user.id } })
  return count > 0
}

/**
 * Records the values a user entered for a program on one day, in each
 * variable's default unit: lab results (`lab`), or doses and check-ins
 * (`today`). `values` maps item ids to the text of the form fields; empty
 * fields are skipped.
 */
export async function recordProgramValues(
  user: DbUser,
  program: Program,
  kind: 'lab' | 'today',
  date: string,
  values: Record<string, string>,
) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T12:00:00Z`))) {
    throw new ProgramError('Enter the date.')
  }
  const startTime = `${date}T12:00:00.000Z`
  if (Date.parse(startTime) > Date.now() + 86_400_000) throw new ProgramError('The date is in the future.')

  const entries = program.items
    .filter((item) => (kind === 'lab' ? item.kind === 'lab' : item.kind !== 'lab') && values[item.id]?.trim())
    .map((item) => {
      const value = Number(values[item.id].trim())
      const range = SCALE_RANGES[item.unitId]
      if (!Number.isFinite(value)) throw new ProgramError(`${item.name}: enter a number.`)
      if (range && (value < range[0] || value > range[1])) {
        throw new ProgramError(`${item.name}: enter a number from ${range[0]} to ${range[1]}.`)
      }
      return { item, value }
    })
  if (entries.length === 0) throw new ProgramError('Enter at least one value.')

  await withUserTransaction(user, async (tx) => {
    for (const { item, value } of entries) {
      await recordMeasurement(tx, user.id, {
        globalVariableId: item.variableId,
        value,
        unitId: item.unitId,
        startTime,
        note: kind === 'lab' ? `Lab result, ${program.name}` : undefined,
      })
    }
  })
  return entries.length
}

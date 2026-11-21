import { analyzeRelationship, dailyValues, type DailyValue, type DayValue, type Relationship } from 'analysis'
import { adminDb, type Prisma } from '@/lib/db'
import { logger } from '@/lib/logger'
import { dailyRulesFor } from '@/lib/patient/variable-stats'
import { dayOf } from '@/lib/reminders/due'
import { zoneOf } from '@/lib/reminders/schedule'
import type { TrackingDb } from '@/lib/tracking/variables'
import { valueInUnit } from '@/lib/units/convert'

/**
 * A person's predictor and outcome relationships (docs/MIGRATION.md, "Patient
 * app modeled on QuantiModo", phase 4): the calculation of packages/analysis on
 * their daily values, stored in user_variable_relationships so that lists can
 * rank and filter them. Triggers mark a person's analysis due
 * (relationship_analysis_due) when their measurements or time zone change, and
 * analyzeDuePeople, run every hour by app/api/cron/relationships, recomputes
 * their relationships one outcome at a time.
 */

/**
 * The categories of outcomes: how a person feels, functions and performs. As
 * in QuantiModo, any variable can be a predictor, but only outcomes are
 * analyzed as outcomes.
 */
export const OUTCOME_CATEGORIES = new Set([
  'health-and-physiology',
  'mental-and-emotional-state',
  'cognitive-performance',
  'productivity-and-learning',
])

/** One of the person's variables, as daily values in their unit for it, on their local days. */
export type PersonVariable = {
  globalVariableId: string
  isOutcome: boolean
  unitId: string
  measurements: number
  daily: DailyValue[]
  filled: boolean
}

const convertible = { id: true, unit_category_id: true, conversion_factor: true, conversion_offset: true } as const

/**
 * The person's variables with measurements. `db` is the person's transaction or,
 * in the job, the full-access client: every query is limited to the person.
 */
export async function loadPersonVariables(db: TrackingDb, userId: string): Promise<PersonVariable[]> {
  const [profile, userVariables, measurements] = await Promise.all([
    db.profiles.findUnique({ where: { id: userId }, select: { timezone: true } }),
    db.user_variables.findMany({
      where: { user_id: userId, deleted_at: null },
      select: {
        global_variable_id: true,
        units: { select: convertible },
        global_variables: { select: { variable_category_id: true, molar_mass: true, units: { select: convertible } } },
      },
    }),
    db.measurements.findMany({
      where: { user_id: userId, deleted_at: null },
      select: { global_variable_id: true, value: true, start_at: true, unit_id: true },
    }),
  ])
  const zone = zoneOf(profile?.timezone)
  const unitIds = [...new Set(measurements.map((m) => m.unit_id))]
  const units = new Map((await db.units.findMany({ where: { id: { in: unitIds } }, select: convertible })).map((unit) => [unit.id, unit]))
  const byVariable = new Map<string, typeof measurements>()
  for (const measurement of measurements) {
    byVariable.set(measurement.global_variable_id, [...(byVariable.get(measurement.global_variable_id) ?? []), measurement])
  }

  return userVariables.flatMap((row) => {
    const rows = byVariable.get(row.global_variable_id)
    if (!rows?.length) return []
    const unit = row.units ?? row.global_variables.units
    const categoryId = row.global_variables.variable_category_id
    const rules = dailyRulesFor({ categoryId, unitId: unit.id })
    // Each value in the person's unit for the variable; one that does not convert is left out.
    const values: DayValue[] = rows.flatMap((m) => {
      const from = units.get(m.unit_id)
      const value = from ? valueInUnit(Number(m.value), from, unit, row.global_variables.molar_mass) : null
      return value === null ? [] : [{ day: dayOf(m.start_at, zone), value }]
    })
    return [{
      globalVariableId: row.global_variable_id,
      isOutcome: OUTCOME_CATEGORIES.has(categoryId),
      unitId: unit.id,
      measurements: rows.length,
      daily: dailyValues(values, rules),
      filled: rules.fillingType === 'zero',
    }]
  })
}

export type PersonRelationship = Relationship & {
  predictor: PersonVariable
  outcome: PersonVariable
}

/** The relationships of one outcome that the person's data supports: each of their other variables as its predictor. */
export function relationshipsOf(variables: PersonVariable[], outcome: PersonVariable): PersonRelationship[] {
  return variables.flatMap((predictor) => {
    if (predictor === outcome) return []
    const relationship = analyzeRelationship(predictor, outcome)
    return relationship ? [{ ...relationship, predictor, outcome }] : []
  })
}

function rowOf(userId: string, r: PersonRelationship, analyzedAt: Date): Prisma.user_variable_relationshipsCreateManyInput {
  return {
    user_id: userId,
    predictor_global_variable_id: r.predictor.globalVariableId,
    outcome_global_variable_id: r.outcome.globalVariableId,
    method_version: r.methodVersion,
    onset_delay_days: r.onsetDelayDays,
    duration_of_action_days: r.durationOfActionDays,
    windows_tried: r.windows.length,
    windows: r.windows as unknown as Prisma.InputJsonValue,
    effective_windows: r.effectiveWindows,
    number_of_pairs: r.numberOfPairs,
    effective_pairs: r.effectivePairs,
    first_pair_date: new Date(`${r.firstPairDate}T00:00:00.000Z`),
    last_pair_date: new Date(`${r.lastPairDate}T00:00:00.000Z`),
    predictor_measurements: r.predictor.measurements,
    outcome_measurements: r.outcome.measurements,
    predictor_days: r.predictorDays,
    outcome_days: r.outcomeDays,
    correlation: r.correlation,
    trend_adjusted_correlation: r.trendAdjustedCorrelation,
    reverse_correlation: r.reverseCorrelation,
    p_value: r.pValue,
    predictor_unit_id: r.predictor.unitId,
    outcome_unit_id: r.outcome.unitId,
    low_predictor_pairs: r.lowPredictorPairs,
    high_predictor_pairs: r.highPredictorPairs,
    predictor_low_average: r.predictorLowAverage,
    predictor_high_average: r.predictorHighAverage,
    outcome_with_low_predictor: r.outcomeWithLowPredictor,
    outcome_with_high_predictor: r.outcomeWithHighPredictor,
    value_predicting_high_outcome: r.valuePredictingHighOutcome,
    value_predicting_low_outcome: r.valuePredictingLowOutcome,
    analyzed_at: analyzedAt,
  }
}

/** Recomputes one outcome's relationships and replaces its stored ones. Returns how many there are. */
async function analyzeOutcome(userId: string, variables: PersonVariable[], outcome: PersonVariable, now: Date): Promise<number> {
  const relationships = relationshipsOf(variables, outcome)
  await adminDb.$transaction([
    adminDb.user_variable_relationships.deleteMany({ where: { user_id: userId, outcome_global_variable_id: outcome.globalVariableId } }),
    adminDb.user_variable_relationships.createMany({ data: relationships.map((r) => rowOf(userId, r, now)) }),
  ])
  return relationships.length
}

/** Removes the stored relationships of outcomes the person no longer has. */
async function removeGoneOutcomes(userId: string, variables: PersonVariable[]): Promise<void> {
  const outcomes = variables.filter((v) => v.isOutcome).map((v) => v.globalVariableId)
  await adminDb.user_variable_relationships.deleteMany({ where: { user_id: userId, outcome_global_variable_id: { notIn: outcomes } } })
}

/** Recomputes all of the person's relationships. Returns how many there are. */
export async function analyzePerson(userId: string, now: Date = new Date()): Promise<number> {
  const variables = await loadPersonVariables(adminDb, userId)
  let count = 0
  for (const outcome of variables.filter((v) => v.isOutcome)) count += await analyzeOutcome(userId, variables, outcome, now)
  await removeGoneOutcomes(userId, variables)
  return count
}

export type DueRun = { due: number; analyzed: number; unfinished: number; failed: number }

/**
 * Recomputes the relationships of the people whose data changed until
 * `deadline` (ms since 1970), one outcome at a time, so that a person with
 * much data continues where the last run stopped. People not started yet come
 * first, then the longest waiting; a run that is cut off, or fails, leaves its
 * person behind the others. A person whose data changed during the work starts
 * over.
 */
export async function analyzeDuePeople({ deadline, limit = 100, clock = Date.now }: {
  deadline: number
  limit?: number
  /** The time in ms, checked before each person and each outcome; tests replace it. */
  clock?: () => number
}): Promise<DueRun> {
  const due = await adminDb.relationship_analysis_due.findMany({
    orderBy: [{ started_at: { sort: 'asc', nulls: 'first' } }, { due_at: 'asc' }],
    take: limit,
  })
  const run: DueRun = { due: due.length, analyzed: 0, unfinished: 0, failed: 0 }
  for (const person of due) {
    if (clock() > deadline) break
    const userId = person.user_id
    const now = new Date()
    await adminDb.relationship_analysis_due.updateMany({ where: { user_id: userId }, data: { started_at: now } })
    try {
      const variables = await loadPersonVariables(adminDb, userId)
      const remaining = variables.filter((v) => v.isOutcome && !person.outcomes_done.includes(v.globalVariableId))
      for (const outcome of remaining) {
        if (clock() > deadline) break
        await analyzeOutcome(userId, variables, outcome, now)
        await adminDb.relationship_analysis_due.updateMany({ where: { user_id: userId }, data: { outcomes_done: { push: outcome.globalVariableId } } })
        person.outcomes_done.push(outcome.globalVariableId)
      }
      if (remaining.some((v) => !person.outcomes_done.includes(v.globalVariableId))) {
        run.unfinished++
        break
      }
      await removeGoneOutcomes(userId, variables)
      const done = await adminDb.relationship_analysis_due.deleteMany({ where: { user_id: userId, due_at: person.due_at } })
      if (done.count === 0) {
        await adminDb.relationship_analysis_due.updateMany({ where: { user_id: userId }, data: { outcomes_done: [] } })
      }
      run.analyzed++
    } catch (error) {
      run.failed++
      logger.error("Could not analyze a person's relationships", { userId, error: error instanceof Error ? error.message : String(error) })
    }
  }
  return run
}

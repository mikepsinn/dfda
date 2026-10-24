import { adminDb, dbAs, withUserTransaction, type Prisma } from '@/lib/db'
import { convertValue } from '@/lib/units/convert'
import type { Better, Frequency, ItemKind, VariableOption } from './config'
import { buildPersonReport, LOOKBACK_DAYS, programTotals, type Point, type ReportItem } from './report'

/** Reads programs, their items and their values. Server only. */

const programSelect = {
  id: true,
  slug: true,
  name: true,
  summary: true,
  follow_up_weeks: true,
  care_team_review: true,
  instance_id: true,
  instance_program_items: {
    select: {
      id: true,
      kind: true,
      frequency: true,
      better: true,
      default_value: true,
      global_variable_id: true,
      global_variables: {
        select: { name: true, default_unit_id: true, molar_mass: true, units: { select: { abbreviated_name: true } } },
      },
    },
    orderBy: [{ position: 'asc' }, { id: 'asc' }],
  },
} satisfies Prisma.instance_programsSelect

type ProgramRow = Prisma.instance_programsGetPayload<{ select: typeof programSelect }>

export type ProgramItem = {
  id: string
  kind: ItemKind
  variableId: string
  name: string
  unitId: string
  unit: string
  /** g/mol, for a lab test that converts between mass and amount per volume (lib/units/convert.ts). */
  molarMass: number | null
  frequency: Frequency | null
  better: Better | null
  defaultValue: number | null
}

export type Program = {
  id: string
  slug: string
  name: string
  summary: string | null
  followUpWeeks: number
  /** The care team reviews every member's biomarker reports: joining shares them (see joinProgram). */
  careTeamReview: boolean
  instanceId: string
  items: ProgramItem[]
}

function toProgram(row: ProgramRow): Program {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    summary: row.summary,
    followUpWeeks: row.follow_up_weeks,
    careTeamReview: row.care_team_review,
    instanceId: row.instance_id,
    items: row.instance_program_items.map((item) => ({
      id: item.id,
      kind: item.kind as ItemKind,
      variableId: item.global_variable_id,
      name: item.global_variables.name,
      unitId: item.global_variables.default_unit_id,
      unit: item.global_variables.units.abbreviated_name,
      molarMass: item.global_variables.molar_mass,
      frequency: item.frequency as Frequency | null,
      better: item.better as Better | null,
      defaultValue: item.default_value,
    })),
  }
}

/** The items that the before/after report compares: check-ins and labs. */
export function reportItems(program: Program): ReportItem[] {
  return program.items
    .filter((item) => item.kind !== 'dose')
    .map((item) => ({
      variableId: item.variableId,
      name: item.name,
      unitId: item.unitId,
      unit: item.unit,
      kind: item.kind as 'check_in' | 'lab',
      better: item.better ?? 'neither',
    }))
}

// Programs are public, so these reads need no user.
export async function listPrograms(instanceSlug: string): Promise<Program[]> {
  const rows = await dbAs(null).instance_programs.findMany({
    where: { instances: { slug: instanceSlug } },
    select: programSelect,
    orderBy: { created_at: 'asc' },
  })
  return rows.map(toProgram)
}

export async function findProgram(instanceSlug: string, slug: string): Promise<Program | null> {
  const row = await dbAs(null).instance_programs.findFirst({ where: { instances: { slug: instanceSlug }, slug }, select: programSelect })
  return row ? toProgram(row) : null
}

export async function findProgramById(id: string): Promise<Program | null> {
  const row = await dbAs(null).instance_programs.findUnique({ where: { id }, select: programSelect })
  return row ? toProgram(row) : null
}

/** Which of these programs the user joined. Empty for a visitor who is not signed in. */
export async function joinedProgramIds(user: { id: string } | null, programIds: string[]): Promise<Set<string>> {
  if (!user || programIds.length === 0) return new Set()
  const rows = await dbAs(user).program_enrollments.findMany({
    where: { user_id: user.id, program_id: { in: programIds } },
    select: { program_id: true },
  })
  return new Set(rows.map((row) => row.program_id))
}

/** The variables a program can track, for the program form. */
export async function variableOptions(): Promise<VariableOption[]> {
  const rows = await dbAs(null).global_variables.findMany({
    where: { deleted_at: null },
    select: { id: true, name: true, units: { select: { abbreviated_name: true } }, variable_categories: { select: { name: true } } },
    orderBy: { name: 'asc' },
    take: 2000,
  })
  return rows.map((row) => ({ id: row.id, name: row.name, unit: row.units.abbreviated_name, category: row.variable_categories.name }))
}

type MeasurementReader = Pick<Prisma.TransactionClient, 'measurements' | 'units'>

/**
 * The values of the program's variables per user, in each variable's default
 * unit. A value that does not convert to it (lib/units/convert.ts) is left out.
 */
export async function loadSeries(db: MeasurementReader, userIds: string[], program: Program, since: Date) {
  const items = reportItems(program)
  const rows = await db.measurements.findMany({
    where: {
      user_id: { in: userIds },
      deleted_at: null,
      global_variable_id: { in: items.map((item) => item.variableId) },
      start_at: { gte: since },
    },
    select: { user_id: true, global_variable_id: true, value: true, start_at: true, unit_id: true },
    orderBy: { start_at: 'asc' },
  })
  const unitIds = [...new Set([...rows.map((row) => row.unit_id), ...items.map((item) => item.unitId)])]
  const units = new Map(
    (
      await db.units.findMany({
        where: { id: { in: unitIds } },
        select: { id: true, conversion_factor: true, conversion_offset: true, unit_category_id: true },
      })
    ).map((unit) => [
      unit.id,
      { factor: Number(unit.conversion_factor), offset: Number(unit.conversion_offset), category: unit.unit_category_id },
    ]),
  )
  const defaultUnit = new Map(items.map((item) => [item.variableId, item.unitId]))
  const molarMass = new Map(program.items.map((item) => [item.variableId, item.molarMass]))

  const byUser = new Map<string, Map<string, Point[]>>()
  for (const row of rows) {
    const targetId = defaultUnit.get(row.global_variable_id)!
    let value = row.value
    if (row.unit_id !== targetId) {
      const from = units.get(row.unit_id)
      const to = units.get(targetId)
      const converted = from && to ? convertValue(value, from, to, molarMass.get(row.global_variable_id)) : null
      if (converted === null) continue
      value = converted
    }
    const series = byUser.get(row.user_id) ?? new Map<string, Point[]>()
    const points = series.get(row.global_variable_id) ?? []
    points.push({ at: row.start_at, value })
    series.set(row.global_variable_id, points)
    byUser.set(row.user_id, series)
  }
  return byUser
}

const DAY = 86_400_000

/** The earliest time a report of an enrollment that started at `startedAt` looks at. */
export function lookbackStart(startedAt: Date) {
  return new Date(startedAt.getTime() - LOOKBACK_DAYS * DAY)
}

/** The user's enrollment and report, read with the user's own permissions. */
export async function personalReport(user: { id: string }, program: Program) {
  return withUserTransaction(user, async (tx) => {
    const enrollment = await tx.program_enrollments.findUnique({
      where: { program_id_user_id: { program_id: program.id, user_id: user.id } },
      select: { started_at: true },
    })
    if (!enrollment) return null
    const series = (await loadSeries(tx, [user.id], program, lookbackStart(enrollment.started_at))).get(user.id)
    return buildPersonReport(reportItems(program), series ?? new Map(), enrollment.started_at, program.followUpWeeks)
  })
}

/**
 * Totals for the company that owns the program. People's records are read
 * with the admin client, so the caller must first check that `ownerId` owns
 * the program's instance; only totals leave this function.
 */
export async function programDashboard(ownerId: string, program: Program) {
  const owns = await dbAs({ id: ownerId }).instances.findFirst({
    where: { id: program.instanceId, owner_id: ownerId },
    select: { id: true },
  })
  if (!owns) throw new Error('Only the owner of the instance can see the program totals.')

  const enrollments = await adminDb.program_enrollments.findMany({
    where: { program_id: program.id },
    select: { user_id: true, started_at: true },
  })
  if (enrollments.length === 0) return { enrolled: 0, totals: programTotals(reportItems(program), []) }

  const earliest = lookbackStart(new Date(Math.min(...enrollments.map((enrollment) => enrollment.started_at.getTime()))))
  const series = await loadSeries(adminDb, enrollments.map((enrollment) => enrollment.user_id), program, earliest)
  const reports = enrollments.map((enrollment) =>
    buildPersonReport(reportItems(program), series.get(enrollment.user_id) ?? new Map(), enrollment.started_at, program.followUpWeeks),
  )
  return { enrolled: enrollments.length, totals: programTotals(reportItems(program), reports) }
}

import type { Prisma } from '@/lib/db'
import { invalidArgument, notFound } from './errors'
import type { ListMeasurementsInput, RecordMeasurementInput, UpdateMeasurementInput } from './schemas'
import { ensureUserVariable, resolveUnit, resolveVariable, toUnit, type TrackingDb } from './variables'

const measurementSelect = {
  id: true,
  value: true,
  start_at: true,
  notes: true,
  created_at: true,
  updated_at: true,
  global_variables: { select: { id: true, name: true } },
  units: { select: { id: true, name: true, abbreviated_name: true, unit_category_id: true } },
} as const

type MeasurementRow = Prisma.measurementsGetPayload<{ select: typeof measurementSelect }>

export function toMeasurement(row: MeasurementRow) {
  return {
    id: row.id,
    variable: { id: row.global_variables.id, name: row.global_variables.name },
    value: row.value,
    unit: toUnit(row.units),
    startTime: row.start_at.toISOString(),
    note: row.notes,
    createdAt: row.created_at?.toISOString() ?? null,
    updatedAt: row.updated_at?.toISOString() ?? null,
  }
}

// The page cursor: the start time and id of the last row, newest first.
function encodeCursor(row: { start_at: Date; id: string }) {
  return Buffer.from(`${row.start_at.toISOString()}|${row.id}`).toString('base64url')
}

function decodeCursor(cursor: string) {
  const [time, id] = Buffer.from(cursor, 'base64url').toString().split('|')
  const startAt = new Date(time)
  if (!id || Number.isNaN(startAt.getTime())) throw invalidArgument('The cursor is not valid. Start again without it.')
  return { startAt, id }
}

export async function listMeasurements(db: TrackingDb, userId: string, input: ListMeasurementsInput) {
  const limit = input.limit ?? 50
  const variable =
    input.globalVariableId || input.variableName ? await resolveVariable(db, input) : null
  const after = input.cursor ? decodeCursor(input.cursor) : null
  const rows = await db.measurements.findMany({
    where: {
      user_id: userId,
      deleted_at: null,
      ...(variable ? { global_variable_id: variable.id } : {}),
      start_at: {
        ...(input.startTimeAfter ? { gte: new Date(input.startTimeAfter) } : {}),
        ...(input.startTimeBefore ? { lte: new Date(input.startTimeBefore) } : {}),
      },
      ...(after
        ? { OR: [{ start_at: { lt: after.startAt } }, { start_at: after.startAt, id: { lt: after.id } }] }
        : {}),
    },
    select: measurementSelect,
    orderBy: [{ start_at: 'desc' }, { id: 'desc' }],
    take: limit + 1,
  })
  const page = rows.slice(0, limit)
  return {
    measurements: page.map(toMeasurement),
    nextCursor: rows.length > limit ? encodeCursor(page[page.length - 1]) : null,
  }
}

/** Records a measurement; used by recordMeasurement and by answers to reminders. */
export async function recordMeasurement(db: TrackingDb, userId: string, input: RecordMeasurementInput) {
  const variable = await resolveVariable(db, input)
  const userVariable = await ensureUserVariable(db, userId, variable.id)
  const unit = await resolveUnit(db, input, variable.units, userVariable.preferred_unit_id)
  const row = await db.measurements.create({
    data: {
      user_id: userId,
      global_variable_id: variable.id,
      user_variable_id: userVariable.id,
      value: input.value,
      unit_id: unit.id,
      start_at: input.startTime ? new Date(input.startTime) : new Date(),
      notes: input.note ?? null,
    },
    select: measurementSelect,
  })
  return toMeasurement(row)
}

async function findOwnMeasurement(db: TrackingDb, userId: string, measurementId: string) {
  const row = await db.measurements.findFirst({
    where: { id: measurementId, user_id: userId, deleted_at: null },
    select: { id: true, global_variable_id: true, user_variable_id: true },
  })
  if (!row) throw notFound(`No measurement with id "${measurementId}".`)
  return row
}

export async function updateMeasurement(db: TrackingDb, userId: string, input: UpdateMeasurementInput) {
  const existing = await findOwnMeasurement(db, userId, input.measurementId)
  let unitId: string | undefined
  if (input.unitId || input.unitAbbreviation) {
    const variable = await resolveVariable(db, { globalVariableId: existing.global_variable_id })
    const preferred = existing.user_variable_id
      ? (await db.user_variables.findUnique({ where: { id: existing.user_variable_id }, select: { preferred_unit_id: true } }))
          ?.preferred_unit_id ?? null
      : null
    unitId = (await resolveUnit(db, input, variable.units, preferred)).id
  }
  const row = await db.measurements.update({
    where: { id: existing.id },
    data: {
      ...(input.value !== undefined ? { value: input.value } : {}),
      ...(unitId ? { unit_id: unitId } : {}),
      ...(input.startTime ? { start_at: new Date(input.startTime) } : {}),
      ...(input.note !== undefined ? { notes: input.note } : {}),
      updated_at: new Date(),
    },
    select: measurementSelect,
  })
  return toMeasurement(row)
}

/** Marks a measurement as deleted; the row stays for the record. */
export async function deleteMeasurement(db: TrackingDb, userId: string, measurementId: string) {
  const existing = await findOwnMeasurement(db, userId, measurementId)
  const row = await db.measurements.update({
    where: { id: existing.id },
    data: { deleted_at: new Date(), updated_at: new Date() },
    select: measurementSelect,
  })
  return { ...toMeasurement(row), deleted: true }
}

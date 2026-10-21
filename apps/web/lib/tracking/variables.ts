import type { Prisma } from '@/lib/db'
import { convertibleCategories } from '@/lib/units/convert'
import { invalidArgument, notFound } from './errors'
import type { SearchVariablesInput } from './schemas'

/** A transaction with row-level security as the user (withUserTransaction in lib/db). */
export type TrackingDb = Prisma.TransactionClient

const unitSelect = { id: true, name: true, abbreviated_name: true, unit_category_id: true } as const
type UnitRow = { id: string; name: string; abbreviated_name: string; unit_category_id: string }

export function toUnit(unit: UnitRow) {
  return { id: unit.id, name: unit.name, abbreviation: unit.abbreviated_name }
}

const variableSelect = {
  id: true,
  name: true,
  description: true,
  variable_categories: { select: { id: true, name: true } },
  units: { select: unitSelect },
} as const

type VariableRow = Prisma.global_variablesGetPayload<{ select: typeof variableSelect }>

function toVariable(row: VariableRow) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.variable_categories.name,
    defaultUnit: toUnit(row.units),
  }
}

export async function searchVariables(db: TrackingDb, input: SearchVariablesInput) {
  const query = input.query.trim()
  const rows = await db.global_variables.findMany({
    where: {
      deleted_at: null,
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { global_variable_synonyms: { some: { name: { contains: query, mode: 'insensitive' } } } },
      ],
    },
    select: variableSelect,
    orderBy: { name: 'asc' },
    take: input.limit ?? 20,
  })
  return { variables: rows.map(toVariable) }
}

export async function getVariable(db: TrackingDb, globalVariableId: string) {
  const row = await db.global_variables.findFirst({
    where: { id: globalVariableId, deleted_at: null },
    select: variableSelect,
  })
  if (!row) throw notFound(`No variable with id "${globalVariableId}". Use searchVariables to find one.`)
  return toVariable(row)
}

/** The variable that `globalVariableId` or `variableName` (a name or synonym) names. */
export async function resolveVariable(
  db: TrackingDb,
  ref: { globalVariableId?: string; variableName?: string },
) {
  if (ref.globalVariableId) {
    const row = await db.global_variables.findFirst({
      where: { id: ref.globalVariableId, deleted_at: null },
      select: { id: true, name: true, molar_mass: true, units: { select: unitSelect } },
    })
    if (!row) throw notFound(`No variable with id "${ref.globalVariableId}". Use searchVariables to find one.`)
    return row
  }
  const name = ref.variableName?.trim()
  if (!name) throw invalidArgument('Give globalVariableId or variableName.')
  const matches = await db.global_variables.findMany({
    where: {
      deleted_at: null,
      OR: [
        { name: { equals: name, mode: 'insensitive' } },
        { global_variable_synonyms: { some: { name: { equals: name, mode: 'insensitive' } } } },
      ],
    },
    select: { id: true, name: true, molar_mass: true, units: { select: unitSelect } },
    take: 2,
  })
  if (matches.length === 0) throw notFound(`No variable named "${name}". Use searchVariables to find one.`)
  if (matches.length > 1) {
    throw invalidArgument(`"${name}" names more than one variable. Give globalVariableId instead.`)
  }
  return matches[0]
}

/**
 * The unit for a value of a variable: the given unit, else the user's
 * preferred unit, else the variable's default unit. A given unit must convert
 * to the default unit: the same quantity, or for a lab test with a molar mass
 * (g/mol) mass and amount per volume (lib/units/convert.ts). Scales and other
 * dimensionless units cannot be converted, so for them only the default or
 * preferred unit is accepted.
 */
export async function resolveUnit(
  db: TrackingDb,
  ref: { unitId?: string; unitAbbreviation?: string },
  defaultUnit: UnitRow,
  preferredUnitId: string | null,
  molarMass: number | null = null,
) {
  if (!ref.unitId && !ref.unitAbbreviation) {
    if (preferredUnitId && preferredUnitId !== defaultUnit.id) {
      const preferred = await db.units.findUnique({ where: { id: preferredUnitId }, select: unitSelect })
      if (preferred) return preferred
    }
    return defaultUnit
  }
  const unit = await db.units.findFirst({
    where: ref.unitId ? { id: ref.unitId } : { abbreviated_name: { equals: ref.unitAbbreviation, mode: 'insensitive' } },
    select: unitSelect,
  })
  const given = ref.unitId ?? ref.unitAbbreviation
  if (!unit) throw notFound(`No unit "${given}".`)
  const allowed =
    unit.id === defaultUnit.id ||
    unit.id === preferredUnitId ||
    (unit.unit_category_id !== 'dimensionless' &&
      convertibleCategories(unit.unit_category_id, defaultUnit.unit_category_id, molarMass))
  if (!allowed) {
    throw invalidArgument(
      `The unit "${unit.abbreviated_name}" does not fit this variable. Use "${defaultUnit.abbreviated_name}" or a unit of the same kind.`,
    )
  }
  return unit
}

/** The user's variable row for a global variable, created on first use. */
export async function ensureUserVariable(db: TrackingDb, userId: string, globalVariableId: string) {
  return db.user_variables.upsert({
    where: { user_id_global_variable_id: { user_id: userId, global_variable_id: globalVariableId } },
    create: { user_id: userId, global_variable_id: globalVariableId },
    update: {},
    select: { id: true, preferred_unit_id: true },
  })
}

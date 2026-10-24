import { dbAs, type Prisma } from '@/lib/db'
import { convertValue } from '@/lib/units/convert'
import { SCALE_RANGES } from './config'
import type { Program, ProgramItem } from './data'

/**
 * The units that a member can enter a value in, such as pounds for a weight
 * in kilograms. The value is saved in the unit they chose, the reports convert
 * it (lib/units/convert.ts), and the member's own report shows the unit they
 * chose last. The care team and the company see the program's units. Server only.
 */

export type UnitChoice = { id: string; unit: string }

type UnitRow = { id: string; abbreviated_name: string; unit_category_id: string; conversion_factor: number; conversion_offset: number }

let units: Promise<UnitRow[]> | undefined

/** The catalog's units, read once: they change only with the seed files. */
function allUnits(): Promise<UnitRow[]> {
  units ??= dbAs(null)
    .units.findMany({
      select: { id: true, abbreviated_name: true, unit_category_id: true, conversion_factor: true, conversion_offset: true },
      orderBy: { id: 'asc' },
    })
    .then((rows) => rows.map((row) => ({ ...row, conversion_factor: Number(row.conversion_factor), conversion_offset: Number(row.conversion_offset) })))
    .catch((error) => {
      units = undefined
      throw error
    })
  return units
}

const factors = (unit: UnitRow) => ({ factor: unit.conversion_factor, offset: unit.conversion_offset, category: unit.unit_category_id })

/** Whether a member can enter the values of `item` in other units: a number field, not a rating or a dose. */
function hasUnitChoice(item: ProgramItem): boolean {
  return item.kind !== 'dose' && !SCALE_RANGES[item.unitId]
}

/**
 * The units of each item, by item id: the item's unit first, then the units
 * that its values convert to (the same kind, or the other kind of blood
 * concentration with the substance's molar mass) where one of the item's unit
 * is 0.01 to 100 of the other unit. So a weight in kilograms gets pounds, not
 * milligrams. Items with no other unit are left out.
 */
export async function unitChoices(items: ProgramItem[]): Promise<Map<string, UnitChoice[]>> {
  const rows = await allUnits()
  const byId = new Map(rows.map((row) => [row.id, row]))
  const choices = new Map<string, UnitChoice[]>()
  for (const item of items.filter(hasUnitChoice)) {
    const own = byId.get(item.unitId)
    if (!own) continue
    const others = rows.filter((row) => {
      if (row.id === own.id || row.unit_category_id === 'dimensionless') return false
      const one = convertValue(1, factors(own), factors(row), item.molarMass)
      return one !== null && Math.abs(one) >= 0.01 && Math.abs(one) <= 100
    })
    if (others.length) choices.set(item.id, [own, ...others].map((row) => ({ id: row.id, unit: row.abbreviated_name })))
  }
  return choices
}

/** The unit that the user chose last for each item, by item id, when it is still a choice. */
export async function preferredUnits(
  db: Pick<Prisma.TransactionClient, 'user_variables'>,
  userId: string,
  items: ProgramItem[],
  choices: Map<string, UnitChoice[]>,
): Promise<Map<string, UnitChoice>> {
  const withChoice = items.filter((item) => choices.has(item.id))
  if (withChoice.length === 0) return new Map()
  const rows = await db.user_variables.findMany({
    where: { user_id: userId, global_variable_id: { in: withChoice.map((item) => item.variableId) }, preferred_unit_id: { not: null } },
    select: { global_variable_id: true, preferred_unit_id: true },
  })
  const preferred = new Map<string, UnitChoice>()
  for (const item of withChoice) {
    const unitId = rows.find((row) => row.global_variable_id === item.variableId)?.preferred_unit_id
    const choice = choices.get(item.id)!.find((candidate) => candidate.id === unitId)
    if (choice) preferred.set(item.id, choice)
  }
  return preferred
}

/** The program with the units that the user chose for its items, for the user's own report. */
export async function inPreferredUnits(
  db: Pick<Prisma.TransactionClient, 'user_variables'>,
  userId: string,
  program: Program,
): Promise<Program> {
  const preferred = await preferredUnits(db, userId, program.items, await unitChoices(program.items))
  if (preferred.size === 0) return program
  return {
    ...program,
    items: program.items.map((item) => {
      const choice = preferred.get(item.id)
      return choice ? { ...item, unitId: choice.id, unit: choice.unit } : item
    }),
  }
}

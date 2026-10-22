/**
 * Conversion between units (db/seeds/03_units.sql). Each unit category has a
 * base unit; a unit's conversion_factor is how many of that unit make one base
 * unit, and its offset is added after (only temperatures have one).
 *
 * Two categories hold concentrations of a substance in blood: its mass per
 * volume (base ng/mL; mg/dL, mg/L, pg/mL) and its amount per volume (base
 * mmol/L; µmol/L). A value converts between them only with the molar mass of
 * the substance (global_variables.molar_mass, g/mol): 100 mg/dL of glucose is
 * 5.55 mmol/L, but 100 mg/dL of cholesterol is 2.59 mmol/L.
 */

export const MASS_CONCENTRATION = 'mass-concentration'
export const MOLAR_CONCENTRATION = 'concentration'

export type UnitFactors = { factor: number; offset: number; category: string }

/** 1 ng/mL is 0.001 mg/L, and mg/L divided by g/mol is mmol/L. */
const MG_PER_L_IN_NG_PER_ML = 0.001

/** Whether a value converts between these unit categories, for a substance with this molar mass (g/mol). */
export function convertibleCategories(from: string, to: string, molarMass?: number | null): boolean {
  if (from === to) return true
  const pair = new Set([from, to])
  return Boolean(molarMass) && pair.has(MASS_CONCENTRATION) && pair.has(MOLAR_CONCENTRATION)
}

/**
 * A value in another unit: of the same category, or between mass and amount
 * concentration with the substance's molar mass. Null when the units do not convert.
 */
export function convertValue(value: number, from: UnitFactors, to: UnitFactors, molarMass?: number | null): number | null {
  if (from.factor === 0 || to.factor === 0 || !convertibleCategories(from.category, to.category, molarMass)) return null
  let base = (value - from.offset) / from.factor
  if (from.category === MASS_CONCENTRATION && to.category === MOLAR_CONCENTRATION) {
    base = (base * MG_PER_L_IN_NG_PER_ML) / molarMass!
  } else if (from.category === MOLAR_CONCENTRATION && to.category === MASS_CONCENTRATION) {
    base = (base * molarMass!) / MG_PER_L_IN_NG_PER_ML
  }
  return base * to.factor + to.offset
}

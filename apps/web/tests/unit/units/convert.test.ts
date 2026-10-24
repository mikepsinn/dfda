// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { convertibleCategories, convertValue, MASS_CONCENTRATION, MOLAR_CONCENTRATION, valueInUnit } from '@/lib/units/convert'

// The factors of db/seeds/03_units.sql, and the molar masses of
// db/seeds/99_global_variable_molar_masses.sql. The expected values are the
// usual clinical conversions.
const mass = (factor: number) => ({ factor, offset: 0, category: MASS_CONCENTRATION })
const molar = (factor: number) => ({ factor, offset: 0, category: MOLAR_CONCENTRATION })
const mgPerDl = mass(0.0001)
const mgPerL = mass(0.001)
const gPerL = mass(0.000001)
const ngPerMl = mass(1)
const mmolPerL = molar(1)
const umolPerL = molar(1000)

describe('convertValue', () => {
  it('converts within a category with the units factors', () => {
    expect(convertValue(1, gPerL, mgPerDl)).toBeCloseTo(100) // ApoB: 1 g/L is 100 mg/dL
    expect(convertValue(1, mgPerDl, mgPerL)).toBeCloseTo(10) // CRP: 1 mg/dL is 10 mg/L
    expect(convertValue(1, mgPerL, ngPerMl)).toBeCloseTo(1000)
    expect(convertValue(5, mmolPerL, umolPerL)).toBeCloseTo(5000)
    const celsius = { factor: 1, offset: 0, category: 'temperature' }
    const fahrenheit = { factor: 1.8, offset: 32, category: 'temperature' }
    expect(convertValue(37, celsius, fahrenheit)).toBeCloseTo(98.6)
  })

  it('converts between mass and amount concentration with the molar mass', () => {
    expect(convertValue(100, mgPerDl, mmolPerL, 180.156)).toBeCloseTo(5.551, 3) // glucose
    expect(convertValue(5.551, mmolPerL, mgPerDl, 180.156)).toBeCloseTo(100, 1)
    expect(convertValue(200, mgPerDl, mmolPerL, 386.654)).toBeCloseTo(5.173, 3) // cholesterol
    expect(convertValue(150, mgPerDl, mmolPerL, 885.7)).toBeCloseTo(1.694, 3) // triglycerides
    expect(convertValue(1, mgPerDl, umolPerL, 113.12)).toBeCloseTo(88.4, 1) // creatinine
    expect(convertValue(6, mgPerDl, umolPerL, 168.11)).toBeCloseTo(356.9, 1) // uric acid
    expect(convertValue(14, mgPerDl, mmolPerL, 28.014)).toBeCloseTo(4.998, 3) // urea nitrogen to urea
  })

  it('does not convert between mass and amount without a molar mass, or between other kinds', () => {
    expect(convertValue(100, mgPerDl, mmolPerL)).toBeNull()
    expect(convertValue(100, mgPerDl, mmolPerL, null)).toBeNull()
    expect(convertValue(1, mgPerDl, { factor: 1, offset: 0, category: 'weight' }, 180.156)).toBeNull()
    expect(convertibleCategories(MASS_CONCENTRATION, MOLAR_CONCENTRATION, 180.156)).toBe(true)
    expect(convertibleCategories(MASS_CONCENTRATION, MOLAR_CONCENTRATION, null)).toBe(false)
    expect(convertibleCategories('length', 'length')).toBe(true)
  })
})

describe('valueInUnit', () => {
  const unit = (id: string, unit_category_id: string, conversion_factor: number) => ({ id, unit_category_id, conversion_factor, conversion_offset: 0 })
  const kilogram = unit('kilogram', 'weight', 1)
  const pound = unit('pound', 'weight', 2.20462)

  it('converts a value between two units of the same kind, and keeps it for the same unit', () => {
    expect(valueInUnit(180, pound, kilogram)).toBeCloseTo(81.65, 2)
    expect(valueInUnit(80, kilogram, kilogram)).toBe(80)
  })

  it('gives null for units that do not convert', () => {
    expect(valueInUnit(3, unit('zero-to-ten-scale', 'scale', 1), kilogram)).toBeNull()
  })
})

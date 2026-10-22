import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { adminDb, dbAs, type DbUser } from '@/lib/db'
import { findOrCreateGlobalVariable } from '@/lib/global_variables.lib'
import { seedCodes } from '../shared/variable-codes'
import { convertibleCategories, MASS_CONCENTRATION, MOLAR_CONCENTRATION } from '@/lib/units/convert'

// The shared catalog: variables and their standard codes, units, categories,
// conditions, treatments, pharmacies and OAuth scopes. Everyone reads it; only the full-access client
// (seeds, migrations, scripts) changes it, apart from what the photo import adds
// (see photo-import.test.ts). Runs against a database built by
// scripts/db-plain-setup.ts (see `pnpm test:db`).

const user: DbUser = { id: randomUUID(), email: `catalog-${Date.now()}@example.com` }
const visitor = null

// One existing row of each seeded catalog table.
let rows: {
  unit: { id: string; conversion_factor: number }
  unitCategory: { id: string; description: string | null }
  variableCategory: { id: string; name: string }
  variable: { id: string; name: string }
  condition: { id: string; icd_code: string | null }
  treatment: { id: string; manufacturer: string | null }
  scope: { scope: string; description: string | null }
}
const createdVariableIds: string[] = []

beforeAll(async () => {
  await adminDb.$executeRaw`
    INSERT INTO auth.users (id, email, raw_user_meta_data)
    VALUES (${user.id}::uuid, ${user.email}, '{"user_type":"patient"}'::jsonb)`
  const first = { orderBy: { id: 'asc' as const } }
  rows = {
    unit: await adminDb.units.findFirstOrThrow({ ...first, select: { id: true, conversion_factor: true } }),
    unitCategory: await adminDb.unit_categories.findFirstOrThrow({ ...first, select: { id: true, description: true } }),
    variableCategory: await adminDb.variable_categories.findFirstOrThrow({ ...first, select: { id: true, name: true } }),
    variable: await adminDb.global_variables.findFirstOrThrow({ ...first, select: { id: true, name: true } }),
    condition: await adminDb.global_conditions.findFirstOrThrow({ ...first, select: { id: true, icd_code: true } }),
    treatment: await adminDb.global_treatments.findFirstOrThrow({ ...first, select: { id: true, manufacturer: true } }),
    scope: await adminDb.oauth_scopes.findFirstOrThrow({ orderBy: { scope: 'asc' } }),
  }
})

afterAll(async () => {
  await adminDb.global_variable_synonyms.deleteMany({ where: { global_variable_id: { in: createdVariableIds } } })
  await adminDb.global_variables.deleteMany({ where: { id: { in: createdVariableIds } } })
  await adminDb.$executeRaw`DELETE FROM auth.users WHERE id = ${user.id}::uuid`
  await adminDb.$disconnect()
})

describe('the shared catalog', () => {
  it('is protected: every table in the public schema has row-level security', async () => {
    const tables = await adminDb.$queryRaw<{ name: string }[]>`
      SELECT c.relname AS name
      FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p') AND NOT c.relrowsecurity
      ORDER BY 1`
    expect(tables.map((table) => table.name)).toEqual([])
  })

  it('can be read by visitors and signed-in users', async () => {
    for (const reader of [dbAs(visitor), dbAs(user)]) {
      expect(await reader.variable_categories.count()).toBeGreaterThan(0)
      expect(await reader.unit_categories.count()).toBeGreaterThan(0)
      expect(await reader.units.count()).toBeGreaterThan(0)
      expect(await reader.global_variables.count()).toBeGreaterThan(0)
      expect(await reader.global_conditions.count()).toBeGreaterThan(0)
      expect(await reader.global_treatments.count()).toBeGreaterThan(0)
      expect(await reader.oauth_scopes.count()).toBeGreaterThan(0)
      expect(await reader.global_variable_codes.count()).toBeGreaterThan(0)
      await expect(reader.pharmacies.count()).resolves.toBeGreaterThanOrEqual(0)
    }
  })

  it('cannot be changed or deleted by visitors or signed-in users', async () => {
    const { unit, unitCategory, variableCategory, variable, condition, treatment, scope } = rows
    for (const writer of [dbAs(visitor), dbAs(user)]) {
      const changes = [
        await writer.units.updateMany({ where: { id: unit.id }, data: { conversion_factor: 1234 } }),
        await writer.unit_categories.updateMany({ where: { id: unitCategory.id }, data: { description: 'Changed' } }),
        await writer.variable_categories.updateMany({ where: { id: variableCategory.id }, data: { name: 'Changed' } }),
        await writer.global_variables.updateMany({ where: { id: variable.id }, data: { name: 'Changed' } }),
        await writer.global_conditions.updateMany({ where: { id: condition.id }, data: { icd_code: 'X00' } }),
        await writer.global_treatments.updateMany({ where: { id: treatment.id }, data: { manufacturer: 'Changed' } }),
        await writer.oauth_scopes.updateMany({ where: { scope: scope.scope }, data: { description: 'Changed' } }),
        await writer.units.deleteMany({ where: { id: unit.id } }),
        await writer.global_conditions.deleteMany({ where: { id: condition.id } }),
        await writer.oauth_scopes.deleteMany({ where: { scope: scope.scope } }),
      ]
      expect(changes.map((change) => change.count)).toEqual(changes.map(() => 0))
    }

    expect(await adminDb.units.findUniqueOrThrow({ where: { id: unit.id } })).toMatchObject(unit)
    expect(await adminDb.unit_categories.findUniqueOrThrow({ where: { id: unitCategory.id } })).toMatchObject(unitCategory)
    expect(await adminDb.variable_categories.findUniqueOrThrow({ where: { id: variableCategory.id } })).toMatchObject(variableCategory)
    expect(await adminDb.global_variables.findUniqueOrThrow({ where: { id: variable.id } })).toMatchObject(variable)
    expect(await adminDb.global_conditions.findUniqueOrThrow({ where: { id: condition.id } })).toMatchObject(condition)
    expect(await adminDb.global_treatments.findUniqueOrThrow({ where: { id: treatment.id } })).toMatchObject(treatment)
    expect(await adminDb.oauth_scopes.findUniqueOrThrow({ where: { scope: scope.scope } })).toMatchObject(scope)
  })

  it('gets no new units or categories from visitors or signed-in users', async () => {
    for (const writer of [dbAs(visitor), dbAs(user)]) {
      await expect(
        writer.units.create({
          data: {
            id: `test-unit-${randomUUID()}`,
            unit_category_id: rows.unitCategory.id,
            name: 'Test unit',
            abbreviated_name: 'tu',
            conversion_factor: 1,
          },
        }),
      ).rejects.toThrow(/row-level security/)
      await expect(
        writer.variable_categories.create({ data: { id: `test-category-${randomUUID()}`, name: 'Test category' } }),
      ).rejects.toThrow(/row-level security/)
    }
  })

  it('gets a new variable from a signed-in user (the photo import), not from a visitor', async () => {
    const name = `Catalog test food ${Date.now()}`
    await expect(findOrCreateGlobalVariable(dbAs(visitor), name, 'food')).rejects.toThrow(/row-level security/)

    const id = await findOrCreateGlobalVariable(dbAs(user), name, 'food')
    createdVariableIds.push(id)
    expect(await adminDb.global_variables.findUniqueOrThrow({ where: { id } })).toMatchObject({ name })
    // The insert trigger still adds the name as the first synonym.
    expect(await adminDb.global_variable_synonyms.count({ where: { global_variable_id: id, name } })).toBe(1)
  })

  it('maps lab-test variables to their LOINC codes, which users cannot change', async () => {
    // Every code of the seed file is in the database, so no variable id in it is mistyped (the insert skips unknown variables).
    const stored = await dbAs(visitor).global_variable_codes.findMany({
      select: { global_variable_id: true, system: true, code: true, display: true },
    })
    const key = (variableId: string, system: string, code: string) => `${variableId} ${system} ${code}`
    expect(new Set(stored.map((row) => key(row.global_variable_id, row.system, row.code)))).toEqual(
      new Set(seedCodes().map((row) => key(row.variableId, row.system, row.code))),
    )
    expect(
      stored.filter((row) => row.global_variable_id === 'ldl-cholesterol').map((row) => row.code).sort(),
    ).toEqual(['13457-7', '18262-6', '2089-1'])

    const loinc = 'http://loinc.org'
    const newCode = { global_variable_id: rows.variable.id, system: loinc, code: '2951-2', display: 'Sodium' }
    for (const writer of [dbAs(visitor), dbAs(user)]) {
      await expect(writer.global_variable_codes.create({ data: newCode, select: { code: true } })).rejects.toThrow(
        /row-level security/,
      )
      const changes = [
        await writer.global_variable_codes.updateMany({ where: { system: loinc, code: '4548-4' }, data: { global_variable_id: rows.variable.id } }),
        await writer.global_variable_codes.deleteMany({ where: { system: loinc, code: '4548-4' } }),
      ]
      expect(changes.map((change) => change.count)).toEqual([0, 0])
    }
    expect(await adminDb.global_variable_codes.findUniqueOrThrow({ where: { system_code: { system: loinc, code: '4548-4' } } })).toMatchObject({
      global_variable_id: 'hba1c',
    })

    // A LOINC code in the wrong form, and a code that already belongs to another variable.
    await expect(adminDb.global_variable_codes.create({ data: { ...newCode, code: 'HbA1c' }, select: { code: true } })).rejects.toThrow()
    await expect(adminDb.global_variable_codes.create({ data: { ...newCode, code: '4548-4' }, select: { code: true } })).rejects.toThrow()
  })

  it('has one variable per lab test, which keeps the name of the merged second one', async () => {
    // db/migrations/20261021040000_catalog_lab_units_and_duplicates.sql does the same for an existing database.
    const merged = [
      { id: 'creatinine', formerId: 'blood-creatinine', formerName: 'Blood Creatinine' },
      { id: 'fasting-blood-glucose', formerId: 'fasting-plasma-glucose', formerName: 'Fasting Plasma Glucose' },
      { id: 'crp-c-reactive-protein', formerId: 'c-reactive-protein-crp', formerName: 'C-Reactive Protein (CRP)' },
      { id: 'oxygen-saturation', formerId: 'oxygen-saturation-spo2', formerName: 'Oxygen Saturation (SpO2)' },
    ]
    expect(await adminDb.global_variables.count({ where: { id: { in: merged.map((test) => test.formerId) } } })).toBe(0)
    for (const test of merged) {
      expect(await adminDb.global_variable_synonyms.count({ where: { global_variable_id: test.id, name: test.formerName } })).toBe(1)
    }
    // Their findings are on the merged variables.
    const findings = await adminDb.global_variable_relationships.findMany({
      where: { outcome_global_variable_id: { in: merged.map((test) => test.id) } },
      select: { predictor_global_variable_id: true, outcome_global_variable_id: true },
    })
    expect(findings).toEqual(
      expect.arrayContaining([
        { predictor_global_variable_id: 'lisinopril', outcome_global_variable_id: 'creatinine' },
        { predictor_global_variable_id: 'sitagliptin', outcome_global_variable_id: 'fasting-blood-glucose' },
        { predictor_global_variable_id: 'tocilizumab', outcome_global_variable_id: 'crp-c-reactive-protein' },
        { predictor_global_variable_id: 'albuterol', outcome_global_variable_id: 'oxygen-saturation' },
      ]),
    )
  })

  it('gives lab tests and other variables the units they are measured in', async () => {
    const units = {
      'creatine-kinase-ck': 'units-per-liter',
      'esr-erythrocyte-sedimentation-rate': 'millimeters-per-hour',
      'fasting-insulin': 'micro-international-units-per-milliliter',
      'crp-c-reactive-protein': 'milligrams-per-liter',
      'd-dimer': 'milligrams-per-liter',
      ferritin: 'nanograms-per-milliliter',
      'interleukin-6-il-6': 'picograms-per-milliliter',
      'ketamine-plasma-concentration': 'nanograms-per-milliliter',
      'estimated-glomerular-filtration-rate-egfr': 'milliliters-per-minute-per-1-73-square-meters',
      'forced-expiratory-volume-in-1-second-fev1': 'liter',
      'peak-expiratory-flow-pef': 'liters-per-minute',
      'swollen-joint-count': 'dimensionless-unit',
      'tender-joint-count': 'dimensionless-unit',
      'grip-strength': 'kilogram',
      'gait-speed': 'meters-per-second',
      'rescue-inhaler-use': 'per-day',
      'frequency-of-ibuprofen-use': 'per-day',
      'metformin-dosage': 'milligram',
      'emergency-room-visits': 'per-month',
      'wheezing-episodes': 'per-day',
      'medication-adherence': 'percent',
      'treatment-adherence': 'percent',
    }
    const stored = await adminDb.global_variables.findMany({
      where: { id: { in: Object.keys(units) } },
      select: { id: true, default_unit_id: true },
    })
    expect(Object.fromEntries(stored.map((variable) => [variable.id, variable.default_unit_id]))).toEqual(units)
  })

  it('keeps mass and amount per volume apart, and gives lab tests reported in both their molar mass', async () => {
    const kinds = await adminDb.units.findMany({
      where: { unit_category_id: { in: [MASS_CONCENTRATION, MOLAR_CONCENTRATION] } },
      select: { id: true, unit_category_id: true },
    })
    const kindOf = Object.fromEntries(kinds.map((unit) => [unit.id, unit.unit_category_id]))
    expect(kindOf).toMatchObject({
      'milligrams-per-deciliter': MASS_CONCENTRATION,
      'grams-per-liter': MASS_CONCENTRATION,
      'milligrams-per-liter': MASS_CONCENTRATION,
      'millimoles-per-liter': MOLAR_CONCENTRATION,
      'micromoles-per-liter': MOLAR_CONCENTRATION,
    })
    const molar = await adminDb.global_variables.findMany({ where: { molar_mass: { not: null } }, select: { id: true, molar_mass: true } })
    expect(Object.fromEntries(molar.map((variable) => [variable.id, variable.molar_mass]))).toEqual({
      'blood-glucose': 180.156,
      'fasting-blood-glucose': 180.156,
      'postprandial-glucose': 180.156,
      'total-cholesterol': 386.654,
      'ldl-cholesterol': 386.654,
      'hdl-cholesterol': 386.654,
      triglycerides: 885.7,
      creatinine: 113.12,
      'uric-acid': 168.11,
      'blood-urea-nitrogen-bun': 28.014,
      'blood-potassium': 39.098,
      'salicylate-level': 138.12,
    })
  })

  it("states every effect's absolute change in a unit that converts to the outcome's unit", async () => {
    const effects = await adminDb.global_variable_relationships.findMany({
      where: { absolute_change_unit_id: { not: null } },
      select: {
        predictor_global_variable_id: true,
        outcome_global_variable_id: true,
        units: { select: { unit_category_id: true } },
        outcome_variable: { select: { molar_mass: true, units: { select: { unit_category_id: true } } } },
      },
    })
    expect(effects.length).toBeGreaterThan(100)
    const mismatched = effects
      .filter(
        (effect) =>
          !convertibleCategories(
            effect.units!.unit_category_id,
            effect.outcome_variable.units.unit_category_id,
            effect.outcome_variable.molar_mass,
          ),
      )
      .map((effect) => `${effect.predictor_global_variable_id} → ${effect.outcome_global_variable_id}`)
    expect(mismatched).toEqual([])
  })
})

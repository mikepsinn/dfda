import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { adminDb, dbAs, type DbUser } from '@/lib/db'
import { findOrCreateGlobalVariable } from '@/lib/global_variables.lib'

// The shared catalog: variables, units, categories, conditions, treatments,
// pharmacies and OAuth scopes. Everyone reads it; only the full-access client
// (seeds, migrations, scripts) changes it. Runs against a database built by
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
})
